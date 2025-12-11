"""
RAG Services for document processing and vector store management.
"""
import os
import re
import logging
from pathlib import Path
from typing import List, Optional, Dict
from django.conf import settings
from .models import VectorStore, ExamVectorStore

logger = logging.getLogger(__name__)

# Check if required libraries are available
try:
    import chromadb
    from chromadb.config import Settings as ChromaSettings
    CHROMADB_AVAILABLE = True
except ImportError:
    CHROMADB_AVAILABLE = False
    logger.warning("ChromaDB not installed. Vector store functionality will be limited.")

try:
    from langchain.text_splitter import RecursiveCharacterTextSplitter
    from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, TextLoader
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False
    logger.warning("LangChain not installed. Document processing will be limited.")

try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    logger.warning("Sentence Transformers not installed. Using basic embeddings.")


class DocumentProcessor:
    """Process documents and create vector stores."""
    
    def __init__(self):
        """Initialize document processor."""
        self.text_splitter = None
        self.embedding_model = None
        
        if LANGCHAIN_AVAILABLE:
            self.text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200,
                length_function=len,
            )
        
        if SENTENCE_TRANSFORMERS_AVAILABLE:
            try:
                # Use a lightweight model suitable for educational content
                self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
            except Exception as e:
                logger.error(f"Failed to load embedding model: {str(e)}")
    
    def load_document(self, file_path: str) -> List[str]:
        """Load and extract text from document."""
        if not LANGCHAIN_AVAILABLE:
            logger.error("LangChain not available. Cannot process document.")
            return []
        
        file_extension = Path(file_path).suffix.lower()
        
        try:
            if file_extension == '.pdf':
                loader = PyPDFLoader(file_path)
            elif file_extension in ['.docx', '.doc']:
                loader = Docx2txtLoader(file_path)
            elif file_extension == '.txt':
                loader = TextLoader(file_path)
            else:
                logger.error(f"Unsupported file type: {file_extension}")
                return []
            
            documents = loader.load()
            return [doc.page_content for doc in documents]
        
        except Exception as e:
            logger.error(f"Error loading document {file_path}: {str(e)}")
            return []
    
    def extract_chapter_metadata(self, text: str) -> Optional[Dict[str, str]]:
        """
        Extract chapter/unit information from text chunk.
        Reuses existing normalization logic from ai_tools.chapter_utils.
        """
        # Look for chapter/unit headers
        patterns = [
            r'UNIT\s+([IVXLCDM]+|[0-9]+|ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|ELEVEN|TWELVE|THIRTEEN|FOURTEEN|FIFTEEN|SIXTEEN|SEVENTEEN|EIGHTEEN|NINETEEN|TWENTY)',
            r'CHAPTER\s+([IVXLCDM]+|[0-9]+|ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|ELEVEN|TWELVE|THIRTEEN|FOURTEEN|FIFTEEN|SIXTEEN|SEVENTEEN|EIGHTEEN|NINETEEN|TWENTY)',
            r'MODULE\s+([IVXLCDM]+|[0-9]+|ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|ELEVEN|TWELVE|THIRTEEN|FOURTEEN|FIFTEEN|SIXTEEN|SEVENTEEN|EIGHTEEN|NINETEEN|TWENTY)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text[:500], re.IGNORECASE)  # Check first 500 chars
            if match:
                chapter_identifier = match.group(0)  # Full match (e.g., "UNIT THREE")
                
                # Use existing normalization from chapter_utils
                try:
                    from ai_tools.chapter_utils import extract_chapter_number
                    chapter_info = extract_chapter_number(chapter_identifier)
                    if chapter_info and chapter_info.get('number'):
                        return {
                            'chapter': str(chapter_info['number']),
                            'chapter_raw': chapter_info['original']
                        }
                except ImportError:
                    # Fallback to simple extraction if chapter_utils not available
                    chapter_raw = match.group(1)
                    chapter_num = self._normalize_chapter_number_fallback(chapter_raw)
                    return {
                        'chapter': str(chapter_num),
                        'chapter_raw': chapter_raw
                    }
        
        return None
    
    def _normalize_chapter_number_fallback(self, chapter_raw: str) -> int:
        """Fallback normalization if chapter_utils not available."""
        # Try direct number conversion
        if chapter_raw.isdigit():
            return int(chapter_raw)
        
        # Word to number mapping (basic)
        word_map = {
            'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
            'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
            'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14,
            'fifteen': 15, 'sixteen': 16, 'seventeen': 17, 'eighteen': 18,
            'nineteen': 19, 'twenty': 20
        }
        
        chapter_lower = chapter_raw.lower()
        if chapter_lower in word_map:
            return word_map[chapter_lower]
        
        # Roman numeral conversion (basic)
        roman_map = {
            'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5,
            'vi': 6, 'vii': 7, 'viii': 8, 'ix': 9, 'x': 10,
            'xi': 11, 'xii': 12, 'xiii': 13, 'xiv': 14, 'xv': 15,
            'xvi': 16, 'xvii': 17, 'xviii': 18, 'xix': 19, 'xx': 20
        }
        
        if chapter_lower in roman_map:
            return roman_map[chapter_lower]
        
        # Default to 1 if can't parse
        return 1
    
    def split_text(self, texts: List[str]) -> List[str]:
        """Split texts into chunks."""
        if not self.text_splitter:
            # Fallback: simple splitting by paragraphs
            chunks = []
            for text in texts:
                paragraphs = text.split('\n\n')
                chunks.extend([p.strip() for p in paragraphs if p.strip()])
            return chunks
        
        all_chunks = []
        for text in texts:
            chunks = self.text_splitter.split_text(text)
            all_chunks.extend(chunks)
        
        return all_chunks
    
    def create_vector_store(
        self, 
        chunks: List[str], 
        vector_store_path: str,
        metadata: dict
    ) -> int:
        """Create ChromaDB vector store from text chunks."""
        if not CHROMADB_AVAILABLE:
            logger.error("ChromaDB not available. Cannot create vector store.")
            return 0
        
        try:
            # Create directory for vector store
            os.makedirs(vector_store_path, exist_ok=True)
            
            # Initialize ChromaDB client
            client = chromadb.PersistentClient(
                path=vector_store_path,
                settings=ChromaSettings(
                    anonymized_telemetry=False,
                    allow_reset=True
                )
            )
            
            # Create or get collection
            # Check if this is an exam or curriculum document
            if 'exam_type' in metadata:
                # Exam document: exam_{exam_type}_{subject}
                collection_name = f"exam_{metadata.get('exam_type', 'unknown')}_{metadata.get('subject', 'unknown')}"
            else:
                # Curriculum document: curriculum_{grade}_{subject}
                collection_name = f"curriculum_{metadata.get('grade', 'unknown')}_{metadata.get('subject', 'unknown')}"
            
            collection_name = collection_name.replace(' ', '_').lower()
            
            collection = client.get_or_create_collection(
                name=collection_name,
                metadata=metadata
            )
            
            # Add documents to collection
            ids = [f"chunk_{i}" for i in range(len(chunks))]
            
            # Extract chapter metadata for each chunk
            chunk_metadatas = []
            for chunk in chunks:
                chunk_meta = metadata.copy()
                chapter_info = self.extract_chapter_metadata(chunk)
                if chapter_info:
                    chunk_meta.update(chapter_info)
                    logger.debug(f"Extracted chapter metadata: {chapter_info}")
                chunk_metadatas.append(chunk_meta)
            
            # Add chunks in batches to avoid memory issues
            batch_size = 100
            for i in range(0, len(chunks), batch_size):
                batch_chunks = chunks[i:i+batch_size]
                batch_ids = ids[i:i+batch_size]
                batch_metas = chunk_metadatas[i:i+batch_size]
                
                collection.add(
                    documents=batch_chunks,
                    ids=batch_ids,
                    metadatas=batch_metas
                )
            
            logger.info(f"Created vector store with {len(chunks)} chunks at {vector_store_path}")
            return len(chunks)
        
        except Exception as e:
            logger.error(f"Error creating vector store: {str(e)}")
            return 0


def process_document_to_vector_store(vector_store_id: int, is_exam: bool = False) -> bool:
    """
    Process a document and create its vector store.
    
    Args:
        vector_store_id: ID of the VectorStore or ExamVectorStore instance
        is_exam: If True, process as ExamVectorStore, else as VectorStore
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        if is_exam:
            vector_store = ExamVectorStore.objects.get(id=vector_store_id)
        else:
            vector_store = VectorStore.objects.get(id=vector_store_id)
        
        # Check if file exists
        if not vector_store.file:
            logger.error(f"No file attached to vector store {vector_store_id}")
            vector_store.status = 'Failed'
            vector_store.save()
            return False
        
        file_path = vector_store.file.path
        
        if not os.path.exists(file_path):
            logger.error(f"File not found: {file_path}")
            vector_store.status = 'Failed'
            vector_store.save()
            return False
        
        # Initialize processor
        processor = DocumentProcessor()
        
        # Load document
        logger.info(f"Loading document: {file_path}")
        texts = processor.load_document(file_path)
        
        if not texts:
            logger.error(f"Failed to extract text from {file_path}")
            vector_store.status = 'Failed'
            vector_store.save()
            return False
        
        # Split into chunks
        logger.info(f"Splitting document into chunks")
        chunks = processor.split_text(texts)
        
        if not chunks:
            logger.error(f"No chunks created from {file_path}")
            vector_store.status = 'Failed'
            vector_store.save()
            return False
        
        # Create vector store path based on type
        if is_exam:
            vector_store_dir = os.path.join(
                settings.MEDIA_ROOT,
                'exam_vector_stores',
                vector_store.region.replace(' ', '_'),
                vector_store.exam_type,
                f'Subject_{vector_store.subject}',
                f'Year_{vector_store.exam_year if vector_store.exam_year else "All"}',
                f'store_{vector_store_id}'
            )
            
            # Prepare metadata for exam
            metadata = {
                'exam_type': vector_store.exam_type,
                'subject': vector_store.subject,
                'exam_year': vector_store.exam_year or 'All',
                'exam_year': vector_store.exam_year or 'All',
                'stream': vector_store.stream,
                'region': vector_store.region,
                'chapter': vector_store.chapter or '',
                'file_name': vector_store.file_name,
                'created_at': vector_store.created_at.isoformat(),
            }
        else:
            vector_store_dir = os.path.join(
                settings.MEDIA_ROOT,
                'vector_stores',
                vector_store.region.replace(' ', '_'),
                f'Grade_{vector_store.grade.replace("Grade ", "").replace(" ", "_")}',
                f'Subject_{vector_store.subject}',
                f'store_{vector_store_id}'
            )
            
            # Prepare metadata for curriculum
            metadata = {
                'grade': vector_store.grade,
                'subject': vector_store.subject,
                'stream': vector_store.stream,
                'region': vector_store.region,
                'file_name': vector_store.file_name,
                'created_at': vector_store.created_at.isoformat(),
            }
        
        # Create vector store
        logger.info(f"Creating vector store at {vector_store_dir}")
        chunk_count = processor.create_vector_store(chunks, vector_store_dir, metadata)
        
        if chunk_count > 0:
            # Update vector store record
            vector_store.vector_store_path = vector_store_dir
            vector_store.chunk_count = chunk_count
            vector_store.status = 'Active'
            vector_store.save()
            
            logger.info(f"Successfully processed vector store {vector_store_id}")
            return True
        else:
            logger.error(f"Failed to create vector store for {vector_store_id}")
            vector_store.status = 'Failed'
            vector_store.save()
            return False
    
    except (VectorStore.DoesNotExist, ExamVectorStore.DoesNotExist):
        logger.error(f"Vector store {vector_store_id} not found")
        return False
    
    except Exception as e:
        logger.error(f"Error processing vector store {vector_store_id}: {str(e)}")
        try:
            vector_store = VectorStore.objects.get(id=vector_store_id)
            vector_store.status = 'Failed'
            vector_store.save()
        except:
            pass
        return False


def query_vector_store(
    vector_store_id: int,
    query: str,
    top_k: int = 5
) -> List[dict]:
    """
    Query a vector store for relevant documents.
    
    Args:
        vector_store_id: ID of the VectorStore instance
        query: Query string
        top_k: Number of results to return
        
    Returns:
        List of relevant documents with metadata
    """
    if not CHROMADB_AVAILABLE:
        logger.error("ChromaDB not available. Cannot query vector store.")
        return []
    
    try:
        vector_store = VectorStore.objects.get(id=vector_store_id)
        
        if not vector_store.vector_store_path or not os.path.exists(vector_store.vector_store_path):
            logger.error(f"Vector store path not found: {vector_store.vector_store_path}")
            return []
        
        # Initialize ChromaDB client
        client = chromadb.PersistentClient(
            path=vector_store.vector_store_path,
            settings=ChromaSettings(
                anonymized_telemetry=False
            )
        )
        
        # Get collection
        collection_name = f"curriculum_{vector_store.grade}_{vector_store.subject}"
        collection_name = collection_name.replace(' ', '_').lower()
        
        collection = client.get_collection(name=collection_name)
        
        # Query collection
        results = collection.query(
            query_texts=[query],
            n_results=top_k
        )
        
        # Format results
        documents = []
        if results and results['documents']:
            for i, doc in enumerate(results['documents'][0]):
                # Build metadata
                metadata = {}
                if results.get('metadatas') and len(results['metadatas']) > 0:
                    metadata.update(results['metadatas'][0][i])
                metadata['vector_store_id'] = vector_store.id
                metadata['file_name'] = vector_store.file_name
                
                documents.append({
                    'content': doc,
                    'metadata': metadata,
                    'distance': results['distances'][0][i] if results['distances'] else None
                })
        
        return documents
    
    except Exception as e:
        logger.error(f"Error querying vector store {vector_store_id}: {str(e)}")
        return []


def _normalize_chapter_for_filter(chapter_input: str) -> int:
    """
    Normalize chapter input to a number for filtering.
    Reuses existing normalization from ai_tools.chapter_utils.
    Handles: "3", "Three", "Chapter 3", "Unit Three", etc.
    """
    try:
        from ai_tools.chapter_utils import extract_chapter_number
        chapter_info = extract_chapter_number(chapter_input)
        if chapter_info and chapter_info.get('number'):
            return chapter_info['number']
    except ImportError:
        pass
    
    # Fallback normalization
    chapter_lower = chapter_input.lower().strip()
    
    # Remove common prefixes
    for prefix in ['chapter', 'unit', 'module']:
        chapter_lower = chapter_lower.replace(prefix, '').strip()
    
    # Try direct number conversion
    if chapter_lower.isdigit():
        return int(chapter_lower)
    
    # Word to number mapping
    word_map = {
        'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
        'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
        'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14,
        'fifteen': 15, 'sixteen': 16, 'seventeen': 17, 'eighteen': 18,
        'nineteen': 19, 'twenty': 20
    }
    
    if chapter_lower in word_map:
        return word_map[chapter_lower]
    
    # Roman numeral conversion
    roman_map = {
        'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5,
        'vi': 6, 'vii': 7, 'viii': 8, 'ix': 9, 'x': 10,
        'xi': 11, 'xii': 12, 'xiii': 13, 'xiv': 14, 'xv': 15,
        'xvi': 16, 'xvii': 17, 'xviii': 18, 'xix': 19, 'xx': 20
    }
    
    if chapter_lower in roman_map:
        return roman_map[chapter_lower]
    
    # Default to 1 if can't parse
    return 1


def query_curriculum_documents(
    grade: str,
    subject: str,
    query: str,
    region: str = None,
    stream: str = None,
    chapter: str = None,
    top_k: int = 5,
    extract_full_chapter: bool = False,
    max_chars: int = 32000  # Default to 32k for Ollama compatibility
) -> List[dict]:
    """
    Query curriculum documents by grade and subject.
    Retrieves relevant content from all active vector stores matching the criteria.
    
    Args:
        grade: Grade level (e.g., "Grade 7", "Grade 11")
        subject: Subject name (e.g., "Physics", "Mathematics")
        query: Query string (topic or learning objectives)
        region: Region name (e.g., "Addis Ababa")
        stream: Stream for Grades 11-12 (e.g., "Natural Science")
        chapter: Chapter/unit number to filter by (e.g., "3", "Three")
        top_k: Number of results to return per vector store
        extract_full_chapter: If True, extract complete chapter content instead of chunks
        max_chars: Maximum characters to extract (default 32000)
        
    Returns:
        List of relevant documents with metadata from all matching vector stores
    """
    if not CHROMADB_AVAILABLE:
        logger.error("ChromaDB not available. Cannot query curriculum documents.")
        return []
    
    try:
        # Find all active vector stores matching the criteria
        filters = {
            'grade': grade,
            'subject': subject,
            'status': 'Active'
        }
        
        # Add stream filter for Grades 11-12
        if stream and stream != 'N/A':
            filters['stream'] = stream
            
        # Add region filter if specified
        if region:
            filters['region'] = region
        
        vector_stores = VectorStore.objects.filter(**filters)
        
        if not vector_stores.exists():
            logger.warning(f"No active vector stores found for {grade} - {subject}")
            return []
        
        logger.info(f"Found {vector_stores.count()} vector store(s) for {grade} - {subject}")
        
        chapter_filter_value = None
        chapter_number = None
        chapter_label = chapter.strip() if isinstance(chapter, str) else chapter

        if chapter_label:
            try:
                from ai_tools.chapter_utils import extract_chapter_number
                normalized = extract_chapter_number(chapter_label)
                normalized_number = normalized.get('number') if normalized else None
                if normalized_number:
                    chapter_number = int(normalized_number)
                    chapter_filter_value = str(chapter_number)
                elif chapter_label.isdigit():
                    chapter_number = int(chapter_label)
                    chapter_filter_value = chapter_label
            except Exception as normalize_error:
                logger.debug(f"Chapter normalization fallback: {normalize_error}")
                if chapter_label and chapter_label.isdigit():
                    chapter_number = int(chapter_label)
                    chapter_filter_value = chapter_label

        # If full chapter extraction requested and we have a chapter number
        if extract_full_chapter and chapter_number:
            from .chapter_content_extractor import ChapterContentExtractor
            
            try:
                logger.info(f"📚 Extracting full chapter {chapter_number} content")
                
                all_documents = []
                
                for vs in vector_stores:
                    # Check if path exists, if not try to reconstruct it
                    if not vs.vector_store_path or not os.path.exists(vs.vector_store_path):
                        # Try to reconstruct path with region
                        reconstructed_path = os.path.join(
                            settings.MEDIA_ROOT,
                            'vector_stores',
                            vs.region.replace(' ', '_'),
                            f'Grade_{vs.grade.replace("Grade ", "").replace(" ", "_")}',
                            f'Subject_{vs.subject}',
                            f'store_{vs.id}'
                        )
                        
                        if os.path.exists(reconstructed_path):
                            logger.info(f"🔄 Found valid path at {reconstructed_path}, updating vector store {vs.id}")
                            vs.vector_store_path = reconstructed_path
                            vs.save()
                        else:
                            logger.warning(f"⚠️ Vector store path not found for {vs.id}: {vs.vector_store_path}")
                            continue
                    
                    collection_name = f"curriculum_{grade.replace(' ', '_').lower()}_{subject.replace(' ', '_').lower()}"
                    
                    # Extract full chapter content (prioritize complete extraction)
                    # First try to get complete chapter without query context for metadata extraction
                    chapter_data = ChapterContentExtractor.extract_full_chapter_content(
                        vector_store_path=vs.vector_store_path,
                        collection_name=collection_name,
                        chapter_number=chapter_number,
                        max_chars=max_chars  # Use passed max_chars
                    )
                    
                    # If that fails, try with query context
                    if not chapter_data:
                        chapter_data = ChapterContentExtractor.extract_chapter_with_context(
                            vector_store_path=vs.vector_store_path,
                            collection_name=collection_name,
                            chapter_number=chapter_number,
                            query=query,
                            max_chars=max_chars
                        )
                    
                    if chapter_data:
                        all_documents.append({
                            'content': chapter_data['content'],
                            'metadata': {
                                **chapter_data.get('metadata', {}),
                                'configured_chapter': chapter_label or str(chapter_number)
                            },
                            'source': vs.file_name,
                            'chapter_number': chapter_data['chapter_number'],
                            'title': chapter_data.get('title', f'Chapter {chapter_number}'),
                            'chunk_count': chapter_data.get('chunk_count', 0),
                            'topics': chapter_data.get('topics', []),
                            'learning_objectives': chapter_data.get('learning_objectives', []),
                            'full_chapter': True
                        })
                        logger.info(f"✅ Extracted full chapter {chapter_number} from {vs.file_name}")
                        if chapter_data.get('topics'):
                            logger.info(f"📚 Chapter topics: {', '.join(chapter_data['topics'][:3])}...")
                        if chapter_data.get('learning_objectives'):
                            logger.info(f"🎯 Learning objectives extracted: {len(chapter_data['learning_objectives'])}")
                
                if all_documents:
                    logger.info(f"📖 Total full chapters extracted: {len(all_documents)}")
                    return all_documents
                else:
                    logger.warning(f"⚠️ No full chapter content found, falling back to chunk-based retrieval")
            
            except Exception as e:
                logger.error(f"❌ Full chapter extraction failed: {e}, falling back to chunks")
        
        all_documents = []
        
        # Query each vector store
        for vs in vector_stores:
            # Check if path exists, if not try to reconstruct it
            if not vs.vector_store_path or not os.path.exists(vs.vector_store_path):
                # Try to reconstruct path with region
                reconstructed_path = os.path.join(
                    settings.MEDIA_ROOT,
                    'vector_stores',
                    vs.region.replace(' ', '_'),
                    f'Grade_{vs.grade.replace("Grade ", "").replace(" ", "_")}',
                    f'Subject_{vs.subject}',
                    f'store_{vs.id}'
                )
                
                if os.path.exists(reconstructed_path):
                    logger.info(f"🔄 Found valid path at {reconstructed_path}, updating vector store {vs.id}")
                    vs.vector_store_path = reconstructed_path
                    vs.save()
                else:
                    logger.warning(f"⚠️ Vector store path not found for {vs.id}: {vs.vector_store_path}")
                    continue
            
            try:
                # Initialize ChromaDB client
                client = chromadb.PersistentClient(
                    path=vs.vector_store_path,
                    settings=ChromaSettings(
                        anonymized_telemetry=False
                    )
                )
                
                # Get collection
                collection_name = f"curriculum_{grade.replace(' ', '_').lower()}_{subject.replace(' ', '_').lower()}"
                collection = client.get_collection(name=collection_name)
                
                # Note: Chapter filtering via metadata is optional
                # The query text should already include chapter variants from build_chapter_rag_query()
                # which handles "Chapter 3" → "Unit Three" synonym matching semantically
                where_filter = None
                if chapter_filter_value:
                    # Try metadata filtering if chapter metadata exists
                    try:
                        where_filter = {"chapter": {"$eq": str(chapter_filter_value)}}
                        logger.info(f"🔢 Applying metadata filter for chapter value: {chapter_filter_value}")
                        logger.info(f"🔍 Applying metadata filter: {where_filter}")
                    except Exception as e:
                        logger.warning(f"Chapter metadata filtering not available: {e}")
                        where_filter = None
                else:
                    logger.info(f"📝 No chapter parameter provided, using semantic search only")
                
                # Query collection
                query_params = {
                    "query_texts": [query],
                    "n_results": top_k
                }
                
                logger.info(f"🔎 Query text (first 150 chars): {query[:150]}...")
                
                # Try with metadata filter first if available
                if where_filter:
                    try:
                        logger.info(f"🎯 Attempting query WITH metadata filter...")
                        results = collection.query(**query_params, where=where_filter)
                        # If no results with filter, fall back to no filter
                        if not results or not results.get('documents') or not results['documents'][0]:
                            logger.warning(f"⚠️ No results with chapter filter, falling back to semantic search only")
                            results = collection.query(**query_params)
                            logger.info(f"✅ Fallback query returned {len(results['documents'][0]) if results and results.get('documents') else 0} results")
                        else:
                            logger.info(f"✅ Filtered query returned {len(results['documents'][0])} results")
                    except Exception as e:
                        logger.warning(f"❌ Metadata filtering failed: {e}, using semantic search only")
                        results = collection.query(**query_params)
                else:
                    # No chapter filter, use semantic search with query variants
                    logger.info(f"🎯 Querying WITHOUT metadata filter (semantic search only)...")
                    results = collection.query(**query_params)
                    logger.info(f"✅ Semantic query returned {len(results['documents'][0]) if results and results.get('documents') else 0} results")
                
                # Format results
                if results and results['documents']:
                    for i, doc in enumerate(results['documents'][0]):
                        # Build metadata
                        metadata = {}
                        if results.get('metadatas') and len(results['metadatas']) > 0:
                            metadata.update(results['metadatas'][0][i])
                        
                        # CRITICAL FIX: Filter out "Lesson" chunks if we are looking for a Chapter/Unit
                        # This prevents "Lesson 3" from other units appearing when searching for "Unit 3"
                        chapter_raw = metadata.get('chapter_raw', '').upper()
                        if 'LESSON' in chapter_raw:
                            logger.info(f"🚫 Filtering out Lesson chunk: {chapter_raw}")
                            continue
                            
                        metadata['vector_store_id'] = vs.id
                        metadata['file_name'] = vs.file_name
                        
                        all_documents.append({
                            'content': doc,
                            'metadata': metadata,
                            'distance': results['distances'][0][i] if results['distances'] else None,
                            'source': vs.file_name
                        })
                
                logger.info(f"Retrieved {len(all_documents)} documents (after filtering) from {vs.file_name}")
            
            except Exception as e:
                logger.error(f"Error querying vector store {vs.id}: {str(e)}")
                continue
        
        # Sort by distance (relevance) if available
        if all_documents and all_documents[0].get('distance') is not None:
            all_documents.sort(key=lambda x: x.get('distance', float('inf')))
        
        logger.info(f"Total documents retrieved: {len(all_documents)}")
        return all_documents[:top_k * 2]  # Return top results across all stores
    
    except Exception as e:
        logger.error(f"Error querying curriculum documents: {str(e)}")
        return []


def query_exam_documents(
    exam_type: str,
    subject: str,
    query: str,
    stream: str = None,
    exam_year: str = None,
    chapter: str = None,
    top_k: int = 5
) -> List[dict]:
    """
    Query exam documents (Matric/Model) by exam type and subject.
    Retrieves relevant content from all active exam vector stores matching the criteria.
    
    Args:
        exam_type: Type of exam ('Matric' or 'Model')
        subject: Subject name (e.g., "Physics", "Mathematics")
        query: Query string (topic or learning objectives)
        stream: Stream for Grade 12 (e.g., "Natural Science")
        exam_year: Exam year or range (e.g., "2023", "2020-2023")
        chapter: Chapter/unit number to filter by (e.g., "3", "Three")
        top_k: Number of results to return per vector store
        
    Returns:
        List of relevant documents with metadata from all matching exam vector stores
    """
    if not CHROMADB_AVAILABLE:
        logger.error("ChromaDB not available. Cannot query exam documents.")
        return []
    
    try:
        # Find all active exam vector stores matching the criteria
        filters = {
            'exam_type': exam_type,
            'subject': subject,
            'status': 'Active'
        }
        
        # Add stream filter if specified
        if stream and stream != 'N/A':
            filters['stream'] = stream
        
        # Add exam year filter if specified
        if exam_year:
            filters['exam_year'] = exam_year
        
        exam_stores = ExamVectorStore.objects.filter(**filters)
        
        if not exam_stores.exists():
            logger.warning(f"No active exam stores found for {exam_type} - {subject}")
            return []
        
        logger.info(f"Found {exam_stores.count()} exam store(s) for {exam_type} - {subject}")
        
        all_documents = []
        
        # Query each exam vector store
        for es in exam_stores:
            if not es.vector_store_path or not os.path.exists(es.vector_store_path):
                logger.warning(f"Exam store path not found for {es.id}")
                continue
            
            try:
                # Initialize ChromaDB client
                client = chromadb.PersistentClient(
                    path=es.vector_store_path,
                    settings=ChromaSettings(
                        anonymized_telemetry=False
                    )
                )
                
                # Get collection
                collection_name = f"exam_{exam_type.lower()}_{subject.replace(' ', '_').lower()}"
                collection = client.get_collection(name=collection_name)
                
                # Build metadata filter
                where_filter = None
                if chapter:
                    try:
                        chapter_num = _normalize_chapter_for_filter(chapter)
                        where_filter = {"chapter": {"$eq": str(chapter_num)}}
                        logger.info(f"🔢 Normalized chapter '{chapter}' to number: {chapter_num}")
                        logger.info(f"🔍 Applying metadata filter: {where_filter}")
                    except Exception as e:
                        logger.warning(f"Chapter metadata filtering not available: {e}")
                        where_filter = None
                
                # Query collection
                query_params = {
                    "query_texts": [query],
                    "n_results": top_k
                }
                
                logger.info(f"🔎 Exam query text (first 150 chars): {query[:150]}...")
                
                # Try with metadata filter first if available
                if where_filter:
                    try:
                        logger.info(f"🎯 Attempting exam query WITH metadata filter...")
                        results = collection.query(**query_params, where=where_filter)
                        if not results or not results.get('documents') or not results['documents'][0]:
                            logger.warning(f"⚠️ No results with chapter filter, falling back to semantic search only")
                            results = collection.query(**query_params)
                            logger.info(f"✅ Fallback query returned {len(results['documents'][0]) if results and results.get('documents') else 0} results")
                        else:
                            logger.info(f"✅ Filtered query returned {len(results['documents'][0])} results")
                    except Exception as e:
                        logger.warning(f"❌ Metadata filtering failed: {e}, using semantic search only")
                        results = collection.query(**query_params)
                else:
                    logger.info(f"🎯 Querying exam WITHOUT metadata filter (semantic search only)...")
                    results = collection.query(**query_params)
                    logger.info(f"✅ Semantic query returned {len(results['documents'][0]) if results and results.get('documents') else 0} results")
                
                # Format results
                if results and results['documents']:
                    for i, doc in enumerate(results['documents'][0]):
                        metadata = {}
                        if results.get('metadatas') and len(results['metadatas']) > 0:
                            metadata.update(results['metadatas'][0][i])
                        metadata['exam_store_id'] = es.id
                        metadata['exam_type'] = es.exam_type
                        metadata['exam_year'] = es.exam_year or 'All'
                        
                        all_documents.append({
                            'content': doc,
                            'metadata': metadata,
                            'distance': results['distances'][0][i] if results.get('distances') else None
                        })
                        
                        logger.info(f"📄 Retrieved exam document {i+1}: {doc[:100]}...")
            
            except Exception as e:
                logger.error(f"Error querying exam store {es.id}: {str(e)}")
                continue
        
        # Sort by distance (relevance) if available
        if all_documents and all_documents[0].get('distance') is not None:
            all_documents.sort(key=lambda x: x.get('distance', float('inf')))
        
        logger.info(f"Total exam documents retrieved: {len(all_documents)}")
        return all_documents[:top_k * 2]  # Return top results across all stores
    
    except Exception as e:
        logger.error(f"Error querying exam documents: {str(e)}")
        return []


def get_available_chapters(
    grade: str,
    subject: str,
    region: str = None,
    stream: str = None
) -> List[dict]:
    """
    Extract available chapters from the curriculum vector store.
    Uses RAG to find Table of Contents and LLM to parse it.
    
    Args:
        grade: Grade level
        subject: Subject name
        region: Region name
        stream: Stream name
        
    Returns:
        List of dicts with 'number' and 'title' keys
    """
    try:
        # 1. Query for Table of Contents / Syllabus
        toc_queries = [
            "Table of Contents",
            "List of Chapters",
            "Syllabus",
            "Course Outline",
            "Units covered in this textbook"
        ]
        
        # Aggregate documents from multiple queries to ensure we catch the TOC
        all_docs = []
        seen_content = set()
        
        for query in toc_queries:
            docs = query_curriculum_documents(
                grade=grade,
                subject=subject,
                region=region,
                stream=stream,
                query=query,
                top_k=3
            )
            for doc in docs:
                # Deduplicate based on content hash or first 100 chars
                content_sig = doc['content'][:100]
                if content_sig not in seen_content:
                    seen_content.add(content_sig)
                    all_docs.append(doc['content'])
        
        if not all_docs:
            logger.warning(f"No documents found for TOC extraction for {grade} {subject}")
            return []
            
        # Limit context size
        context = "\n\n".join(all_docs[:5])
        
        # 2. Use LLM to extract chapter list
        from ai_tools.llm.llm_router import LLMRouter
        from ai_tools.llm.models import LLMRequest, UserRole, TaskType, TaskComplexity
        
        llm_router = LLMRouter()
        
        prompt = f"""
        Analyze the following text which likely contains the Table of Contents or Chapter List for a {grade} {subject} textbook.
        Extract a structured list of all chapters or units.
        
        Text:
        {context[:15000]}  # Limit context to avoid token limits
        
        Instructions:
        1. Identify if the book uses "Chapters", "Units", "Modules", or "Sections".
        2. Extract the number and title for each.
        3. Return ONLY a JSON object with a "chapters" key containing a list of objects.
        4. Each object must have:
           - "number": The number (e.g., "1", "2", "3", or "I", "II").
           - "title": The title of the chapter/unit.
           - "label": The type of division (e.g., "Chapter", "Unit", "Module"). Default to "Chapter" if unclear.
        
        Example: 
        {{ 
            "chapters": [ 
                {{ "number": "1", "title": "Introduction to Biology", "label": "Unit" }}, 
                {{ "number": "2", "title": "Cell Structure", "label": "Unit" }} 
            ] 
        }}
        
        If no chapters are found, return {{ "chapters": [] }}.
        """
        
        request = LLMRequest(
            prompt=prompt,
            user_id=0, # System request
            user_role=UserRole.SYSTEM,
            task_type=TaskType.CONTENT_GENERATION, # Generic task
            complexity=TaskComplexity.BASIC,
            temperature=0.1, # Low temperature for deterministic output
            max_tokens=4000,
            # response_format removed as it's not supported in __init__
        )
        
        response = llm_router.process_json_request(request)
        chapters = response.get('chapters', [])
        
        # Sort by number if possible
        try:
            chapters.sort(key=lambda x: int(str(x['number']).replace('Unit', '').replace('Chapter', '').strip()) if str(x['number']).isdigit() else 999)
        except:
            pass
            
        logger.info(f"✅ Extracted {len(chapters)} chapters for {grade} {subject}")
        return chapters
        
    except Exception as e:
        logger.error(f"Error extracting chapters: {e}")
        return []

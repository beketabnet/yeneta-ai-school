"""
Document Processor - Process and chunk documents for RAG
Handles PDF, TXT, MD, and DOCX files with intelligent chunking.
"""

import os
import logging
import re
import hashlib
from typing import List, Dict, Optional, Tuple
from pathlib import Path
from dataclasses import dataclass

logger = logging.getLogger(__name__)

# Try to import document processing libraries
try:
    import PyPDF2
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False
    logger.warning("PyPDF2 not available. Install with: pip install PyPDF2")

try:
    from docx import Document
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False
    logger.warning("python-docx not available. Install with: pip install python-docx")


@dataclass
class DocumentChunk:
    """Represents a chunk of a document"""
    text: str
    metadata: Dict
    chunk_id: str
    source: str
    page_number: Optional[int] = None
    section: Optional[str] = None


class DocumentProcessor:
    """
    Process documents and split them into chunks for RAG.
    Supports multiple file formats and intelligent chunking strategies.
    """
    
    def __init__(
        self,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        min_chunk_size: int = 100
    ):
        """
        Initialize document processor.
        
        Args:
            chunk_size: Target size for each chunk (in characters)
            chunk_overlap: Overlap between chunks (in characters)
            min_chunk_size: Minimum chunk size to keep
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.min_chunk_size = min_chunk_size
        
        logger.info(
            f"DocumentProcessor initialized: "
            f"chunk_size={chunk_size}, overlap={chunk_overlap}"
        )
    
    def process_file(self, file_path: str) -> List[DocumentChunk]:
        """
        Process a file and return document chunks.
        
        Args:
            file_path: Path to the file
        
        Returns:
            List of DocumentChunk objects
        """
        path = Path(file_path)
        
        if not path.exists():
            logger.error(f"File not found: {file_path}")
            return []
        
        # Determine file type and process accordingly
        extension = path.suffix.lower()
        
        if extension == '.pdf':
            return self._process_pdf(file_path)
        elif extension == '.txt':
            return self._process_txt(file_path)
        elif extension == '.md':
            return self._process_markdown(file_path)
        elif extension == '.docx':
            return self._process_docx(file_path)
        else:
            logger.warning(f"Unsupported file type: {extension}")
            return []
    
    def _process_pdf(self, file_path: str) -> List[DocumentChunk]:
        """Process PDF file"""
        if not PDF_AVAILABLE:
            logger.error("PyPDF2 not available. Cannot process PDF.")
            return []
        
        chunks = []
        
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                
                for page_num, page in enumerate(pdf_reader.pages, start=1):
                    text = page.extract_text()
                    
                    if text.strip():
                        page_chunks = self._chunk_text(
                            text,
                            metadata={
                                'source': file_path,
                                'page_number': page_num,
                                'file_type': 'pdf'
                            }
                        )
                        chunks.extend(page_chunks)
            
            logger.info(f"Processed PDF: {file_path} -> {len(chunks)} chunks")
            return chunks
        
        except Exception as e:
            logger.error(f"Failed to process PDF {file_path}: {e}")
            return []
    
    def _process_txt(self, file_path: str) -> List[DocumentChunk]:
        """Process plain text file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                text = file.read()
            
            chunks = self._chunk_text(
                text,
                metadata={
                    'source': file_path,
                    'file_type': 'txt'
                }
            )
            
            logger.info(f"Processed TXT: {file_path} -> {len(chunks)} chunks")
            return chunks
        
        except Exception as e:
            logger.error(f"Failed to process TXT {file_path}: {e}")
            return []
    
    def _process_markdown(self, file_path: str) -> List[DocumentChunk]:
        """Process Markdown file with section awareness"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                text = file.read()
            
            # Split by headers to maintain context
            sections = self._split_by_headers(text)
            
            chunks = []
            for section_title, section_text in sections:
                section_chunks = self._chunk_text(
                    section_text,
                    metadata={
                        'source': file_path,
                        'file_type': 'markdown',
                        'section': section_title
                    }
                )
                chunks.extend(section_chunks)
            
            logger.info(f"Processed MD: {file_path} -> {len(chunks)} chunks")
            return chunks
        
        except Exception as e:
            logger.error(f"Failed to process Markdown {file_path}: {e}")
            return []
    
    def _process_docx(self, file_path: str) -> List[DocumentChunk]:
        """Process DOCX file"""
        if not DOCX_AVAILABLE:
            logger.error("python-docx not available. Cannot process DOCX.")
            return []
        
        try:
            doc = Document(file_path)
            text = '\n\n'.join([para.text for para in doc.paragraphs if para.text.strip()])
            
            chunks = self._chunk_text(
                text,
                metadata={
                    'source': file_path,
                    'file_type': 'docx'
                }
            )
            
            logger.info(f"Processed DOCX: {file_path} -> {len(chunks)} chunks")
            return chunks
        
        except Exception as e:
            logger.error(f"Failed to process DOCX {file_path}: {e}")
            return []
    
    def _split_by_headers(self, text: str) -> List[Tuple[str, str]]:
        """Split markdown text by headers"""
        # Match markdown headers (# Header)
        header_pattern = r'^(#{1,6})\s+(.+)$'
        
        sections = []
        current_section = "Introduction"
        current_text = []
        
        for line in text.split('\n'):
            header_match = re.match(header_pattern, line, re.MULTILINE)
            
            if header_match:
                # Save previous section
                if current_text:
                    sections.append((current_section, '\n'.join(current_text)))
                
                # Start new section
                current_section = header_match.group(2).strip()
                current_text = []
            else:
                current_text.append(line)
        
        # Save last section
        if current_text:
            sections.append((current_section, '\n'.join(current_text)))
        
        return sections
    
    def _chunk_text(
        self,
        text: str,
        metadata: Dict
    ) -> List[DocumentChunk]:
        """
        Split text into overlapping chunks.
        
        Args:
            text: Text to chunk
            metadata: Metadata for the chunks
        
        Returns:
            List of DocumentChunk objects
        """
        if not text or len(text) < self.min_chunk_size:
            return []
        
        chunks = []
        
        # Split by sentences first for better boundaries
        sentences = self._split_into_sentences(text)
        
        current_chunk = []
        current_length = 0
        
        for sentence in sentences:
            sentence_length = len(sentence)
            
            # If adding this sentence exceeds chunk size, save current chunk
            if current_length + sentence_length > self.chunk_size and current_chunk:
                chunk_text = ' '.join(current_chunk)
                
                if len(chunk_text) >= self.min_chunk_size:
                    # Generate unique chunk ID using hash
                    chunk_hash = hashlib.md5(
                        f"{metadata['source']}_{len(chunks)}_{chunk_text[:50]}".encode()
                    ).hexdigest()[:8]
                    
                    chunk = DocumentChunk(
                        text=chunk_text,
                        metadata=metadata.copy(),
                        chunk_id=f"{Path(metadata['source']).stem}_{chunk_hash}_{len(chunks)}",
                        source=metadata['source'],
                        page_number=metadata.get('page_number'),
                        section=metadata.get('section')
                    )
                    chunks.append(chunk)
                
                # Keep overlap
                overlap_length = 0
                overlap_sentences = []
                
                for s in reversed(current_chunk):
                    if overlap_length + len(s) <= self.chunk_overlap:
                        overlap_sentences.insert(0, s)
                        overlap_length += len(s)
                    else:
                        break
                
                current_chunk = overlap_sentences
                current_length = overlap_length
            
            current_chunk.append(sentence)
            current_length += sentence_length
        
        # Add final chunk
        if current_chunk:
            chunk_text = ' '.join(current_chunk)
            
            if len(chunk_text) >= self.min_chunk_size:
                # Generate unique chunk ID using hash
                chunk_hash = hashlib.md5(
                    f"{metadata['source']}_{len(chunks)}_{chunk_text[:50]}".encode()
                ).hexdigest()[:8]
                
                chunk = DocumentChunk(
                    text=chunk_text,
                    metadata=metadata.copy(),
                    chunk_id=f"{Path(metadata['source']).stem}_{chunk_hash}_{len(chunks)}",
                    source=metadata['source'],
                    page_number=metadata.get('page_number'),
                    section=metadata.get('section')
                )
                chunks.append(chunk)
        
        return chunks
    
    def _split_into_sentences(self, text: str) -> List[str]:
        """Split text into sentences"""
        # Simple sentence splitting (can be improved with NLTK)
        # Handle common abbreviations
        text = re.sub(r'\bDr\.', 'Dr', text)
        text = re.sub(r'\bMr\.', 'Mr', text)
        text = re.sub(r'\bMs\.', 'Ms', text)
        text = re.sub(r'\bMrs\.', 'Mrs', text)
        
        # Split on sentence boundaries
        sentences = re.split(r'(?<=[.!?])\s+', text)
        
        return [s.strip() for s in sentences if s.strip()]
    
    def process_directory(
        self,
        directory_path: str,
        recursive: bool = True
    ) -> List[DocumentChunk]:
        """
        Process all supported files in a directory.
        
        Args:
            directory_path: Path to directory
            recursive: Whether to process subdirectories
        
        Returns:
            List of all document chunks
        """
        path = Path(directory_path)
        
        if not path.exists() or not path.is_dir():
            logger.error(f"Directory not found: {directory_path}")
            return []
        
        all_chunks = []
        supported_extensions = {'.pdf', '.txt', '.md', '.docx'}
        
        # Get all files
        if recursive:
            files = [f for f in path.rglob('*') if f.suffix.lower() in supported_extensions]
        else:
            files = [f for f in path.glob('*') if f.suffix.lower() in supported_extensions]
        
        logger.info(f"Processing {len(files)} files from {directory_path}")
        
        for file_path in files:
            chunks = self.process_file(str(file_path))
            all_chunks.extend(chunks)
        
        logger.info(
            f"Processed directory: {directory_path} -> "
            f"{len(files)} files, {len(all_chunks)} chunks"
        )
        
        return all_chunks


# Singleton instance with default settings
document_processor = DocumentProcessor(
    chunk_size=int(os.getenv('RAG_CHUNK_SIZE', 1000)),
    chunk_overlap=int(os.getenv('RAG_CHUNK_OVERLAP', 200)),
    min_chunk_size=int(os.getenv('RAG_MIN_CHUNK_SIZE', 100))
)

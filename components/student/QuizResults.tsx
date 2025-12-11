import React from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Divider,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Paper,
} from '@mui/material';
import {
    CheckCircle as CorrectIcon,
    Cancel as IncorrectIcon,
    ArrowBack as BackIcon,
    EmojiEvents as TrophyIcon,
} from '@mui/icons-material';

interface QuestionResponse {
    id: number;
    question: number;
    response_text: string;
    is_correct: boolean | null;
    score: number;
    feedback: string;
}

interface QuizResult {
    id: number;
    quiz_title: string;
    score: number;
    max_score: number;
    ai_feedback: string;
    responses: QuestionResponse[];
}

interface QuizResultsProps {
    result: QuizResult;
    onBack: () => void;
}

const QuizResults: React.FC<QuizResultsProps> = ({ result, onBack }) => {
    const percentage = (result.score / result.max_score) * 100;
    
    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
            <Button startIcon={<BackIcon />} onClick={onBack} sx={{ mb: 2 }}>
                Back to Dashboard
            </Button>

            <Card elevation={3} sx={{ mb: 3, textAlign: 'center', p: 2 }}>
                <CardContent>
                    <TrophyIcon sx={{ fontSize: 60, color: percentage >= 70 ? 'gold' : 'text.secondary', mb: 2 }} />
                    <Typography variant="h4" gutterBottom>
                        {result.quiz_title} Results
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 1, my: 2 }}>
                        <Typography variant="h2" color="primary.main" fontWeight="bold">
                            {Math.round(percentage)}%
                        </Typography>
                        <Typography variant="h6" color="text.secondary">
                            ({result.score} / {result.max_score})
                        </Typography>
                    </Box>

                    {result.ai_feedback && (
                        <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
                            <Typography variant="subtitle1" fontWeight="bold">AI Feedback</Typography>
                            <Typography variant="body1">{result.ai_feedback}</Typography>
                        </Paper>
                    )}
                </CardContent>
            </Card>

            <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
                Detailed Review
            </Typography>
            
            <List>
                {result.responses.map((resp, index) => (
                    <Paper key={resp.id} sx={{ mb: 2, p: 2 }}>
                        <ListItem alignItems="flex-start" disableGutters>
                            <ListItemIcon sx={{ minWidth: 40, mt: 1 }}>
                                {resp.is_correct === true ? (
                                    <CorrectIcon color="success" />
                                ) : resp.is_correct === false ? (
                                    <IncorrectIcon color="error" />
                                ) : (
                                    <Chip label="Pending" size="small" color="warning" />
                                )}
                            </ListItemIcon>
                            <ListItemText
                                primary={
                                    <Typography variant="subtitle1" fontWeight="bold">
                                        Question {index + 1}
                                    </Typography>
                                }
                                secondary={
                                    <Box sx={{ mt: 1 }}>
                                        <Typography variant="body1" gutterBottom>
                                            <strong>Your Answer:</strong> {resp.response_text}
                                        </Typography>
                                        
                                        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                                            <Chip 
                                                label={`Score: ${resp.score}`} 
                                                size="small" 
                                                color={resp.score > 0 ? "success" : "default"} 
                                                variant="outlined" 
                                            />
                                        </Box>

                                        {resp.feedback && (
                                            <Box sx={{ mt: 1, bgcolor: 'action.hover', p: 1, borderRadius: 1 }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    <strong>Feedback:</strong> {resp.feedback}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                }
                            />
                        </ListItem>
                    </Paper>
                ))}
            </List>
        </Box>
    );
};

export default QuizResults;

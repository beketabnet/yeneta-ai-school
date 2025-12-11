from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from datetime import datetime, timedelta
from .models import EngagementTrend, LearningOutcome
from .serializers import EngagementTrendSerializer, LearningOutcomeSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def engagement_trends_view(request):
    """Get engagement trends data."""
    
    # Return mock data for now
    trends = []
    for i in range(7):
        date = datetime.now().date() - timedelta(days=i)
        trends.append({
            'date': date.isoformat(),
            'active_users': 50 + (i * 5)
        })
    
    return Response(trends)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def learning_outcomes_view(request):
    """Get learning outcomes data."""
    
    # Return mock data for now
    outcomes = [
        {'subject': 'Mathematics', 'average_score': 85.5},
        {'subject': 'Science', 'average_score': 78.3},
        {'subject': 'English', 'average_score': 82.1},
        {'subject': 'History', 'average_score': 79.8},
    ]
    
    return Response(outcomes)


class EngagementTrendViewSet(viewsets.ModelViewSet):
    """ViewSet for managing engagement trends."""
    
    queryset = EngagementTrend.objects.all()
    serializer_class = EngagementTrendSerializer
    permission_classes = [IsAuthenticated]


class LearningOutcomeViewSet(viewsets.ModelViewSet):
    """ViewSet for managing learning outcomes."""
    
    queryset = LearningOutcome.objects.all()
    serializer_class = LearningOutcomeSerializer
    permission_classes = [IsAuthenticated]

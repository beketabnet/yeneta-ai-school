"""
Django management command to setup Ollama models.
Usage: python manage.py setup_ollama [--pull]
"""

from django.core.management.base import BaseCommand
from ai_tools.llm.ollama_manager import ollama_manager


class Command(BaseCommand):
    help = 'Check and setup Ollama models for offline AI'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--pull',
            action='store_true',
            help='Automatically pull missing models'
        )
        
        parser.add_argument(
            '--test',
            action='store_true',
            help='Test all installed models'
        )
    
    def handle(self, *args, **options):
        auto_pull = options['pull']
        test_models = options['test']
        
        self.stdout.write(self.style.SUCCESS('\n🤖 Ollama Setup & Status Check\n'))
        self.stdout.write('=' * 60)
        
        # Get status
        status = ollama_manager.get_status()
        
        if not status['available']:
            self.stdout.write(self.style.ERROR(f"\n❌ Ollama not available: {status.get('error', 'Unknown error')}"))
            self.stdout.write('\n📋 Recommendations:')
            for rec in ollama_manager.get_recommendations():
                self.stdout.write(f"   • {rec}")
            return
        
        # Show server info
        self.stdout.write(self.style.SUCCESS(f"\n✅ Ollama server is running"))
        self.stdout.write(f"   URL: {status['base_url']}")
        self.stdout.write(f"   Total models: {status['model_count']}")
        
        # Show installed models
        if status['models']:
            self.stdout.write('\n📦 Installed Models:')
            for model in status['models']:
                size_mb = model['size'] / (1024 * 1024) if model['size'] else 0
                self.stdout.write(f"   • {model['name']} ({size_mb:.1f} MB)")
        
        # Check required models
        self.stdout.write('\n🎯 Required Models Status:')
        required_status = status['required_models']
        
        for model_type, is_installed in required_status.items():
            model_name = ollama_manager.required_models[model_type]
            if is_installed:
                self.stdout.write(self.style.SUCCESS(f"   ✅ {model_type}: {model_name}"))
            else:
                self.stdout.write(self.style.WARNING(f"   ❌ {model_type}: {model_name} (missing)"))
        
        # Setup missing models if requested
        if auto_pull:
            missing = [k for k, v in required_status.items() if not v]
            
            if missing:
                self.stdout.write(self.style.WARNING(f'\n⬇️  Pulling {len(missing)} missing models...'))
                
                setup_status = ollama_manager.setup_required_models(auto_pull=True)
                
                for model_type, result in setup_status.items():
                    model_name = ollama_manager.required_models[model_type]
                    
                    if result == 'installed':
                        self.stdout.write(f"   ✅ {model_name} - already installed")
                    elif result == 'pulled':
                        self.stdout.write(self.style.SUCCESS(f"   ✅ {model_name} - successfully pulled"))
                    elif result == 'failed':
                        self.stdout.write(self.style.ERROR(f"   ❌ {model_name} - failed to pull"))
            else:
                self.stdout.write(self.style.SUCCESS('\n✅ All required models already installed'))
        
        # Test models if requested
        if test_models:
            self.stdout.write('\n🧪 Testing Models:')
            
            for model_type, model_name in ollama_manager.required_models.items():
                if required_status.get(model_type):
                    self.stdout.write(f"   Testing {model_name}...", ending='')
                    
                    if ollama_manager.test_model(model_name):
                        self.stdout.write(self.style.SUCCESS(' ✅ Working'))
                    else:
                        self.stdout.write(self.style.ERROR(' ❌ Failed'))
        
        # Show recommendations
        recommendations = ollama_manager.get_recommendations()
        
        if recommendations and recommendations[0] != "✅ All Ollama models are installed and ready!":
            self.stdout.write('\n📋 Recommendations:')
            for rec in recommendations:
                self.stdout.write(f"   • {rec}")
        else:
            self.stdout.write(self.style.SUCCESS('\n🎉 Ollama is fully configured and ready!'))
        
        self.stdout.write('\n' + '=' * 60 + '\n')

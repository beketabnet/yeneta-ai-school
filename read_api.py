with open('services/apiService.ts') as f:
    lines = f.readlines()
    for i in range(1533, min(1595, len(lines))):
        print(f'{i+1}: {lines[i]}', end='')

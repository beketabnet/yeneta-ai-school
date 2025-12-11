#!/usr/bin/env python3
"""Fix the apiService.ts file by moving const declarations outside the export object"""

with open('services/apiService.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# The problem: lines 1598-1651 are const declarations inside the export object
# Solution: extract them and place before the export object

# Step 1: Extract the const declarations (lines 1598-1651, indices 1597-1650)
const_declarations_start = 1597  # 0-indexed
const_declarations_end = 1651    # 0-indexed (inclusive)

# Lines to extract and move before export object
extracted_lines = lines[const_declarations_start:const_declarations_end+1]

# Step 2: Find where to insert them (before "export const apiService = {")
export_start_idx = None
for i, line in enumerate(lines):
    if 'export const apiService = {' in line:
        export_start_idx = i
        break

print(f"Found export object at line {export_start_idx + 1}")
print(f"Extracted lines {const_declarations_start + 1} to {const_declarations_end + 1}")

# Step 3: Build the new content
# Part 1: Everything before the const declarations
before_part = lines[:const_declarations_start]

# Part 2: Remove the blank line that precedes the const declarations
# We need to check if line at const_declarations_start - 1 is blank
if before_part[-1].strip() == '':
    # Remove the blank line that was separating from export object
    before_part = before_part[:-1]

# Add one blank line
before_part.append('\n')

# Part 3: The const declarations (with proper formatting)
const_part = extracted_lines.copy()

# Part 4: Add blank line before export object
const_part.append('\n')

# Part 5: Everything from export object onwards, but without the const declarations
# Need to skip from const_declarations_end + 1 to (which includes the blank line at 1652)
# and also skip the incorrectly placed property references

# The tricky part is line 1653 onwards which has property names that should stay
# But line 1597 was blank, so we need to fix that too

after_part = lines[const_declarations_end+2:]  # Skip the blank line after const declarations

# Now join everything
new_content = before_part + const_part + after_part

# Write the fixed file
with open('services/apiService.ts', 'w', encoding='utf-8') as f:
    f.writelines(new_content)

print(f"Original lines: {len(lines)}")
print(f"Fixed lines: {len(new_content)}")
print("Fixed apiService.ts")

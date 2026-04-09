import os

def fix_tailwind_classes(folder_path):
    for root, dirs, files in os.walk(folder_path):
        for file in files:
            if file.endswith((".jsx", ".js")):
                file_path = os.path.join(root, file)
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                new_content = content.replace("surface.card", "surface-card")\
                                     .replace("surface.elevated", "surface-elevated")\
                                     .replace("brand.dark", "brand-dark")\
                                     .replace("brand.light", "brand-light")
                
                if new_content != content:
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(new_content)
                    print(f"Fixed {file_path}")

fix_tailwind_classes(r"d:\Projects\Active\for_my_all\frontend\src")

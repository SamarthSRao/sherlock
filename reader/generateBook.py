import os
import json
import re

input_file = 'canon.txt'
output_file = 'src/bookContent.js'

titles_map = {
  "A STUDY IN SCARLET": "A Study in Scarlet",
  "THE SIGN OF THE FOUR": "The Sign of Four",
  "A SCANDAL IN BOHEMIA": "A Scandal in Bohemia",
  "THE RED-HEADED LEAGUE": "The Red-Headed League",
  "A CASE OF IDENTITY": "A Case of Identity",
  "THE BOSCOMBE VALLEY MYSTERY": "The Boscombe Valley Mystery",
  "THE FIVE ORANGE PIPS": "The Five Orange Pips",
  "THE MAN WITH THE TWISTED LIP": "The Man with the Twisted Lip",
  "THE ADVENTURE OF THE BLUE CARBUNCLE": "The Adventure of the Blue Carbuncle",
  "THE ADVENTURE OF THE SPECKLED BAND": "The Adventure of the Speckled Band",
  "THE ADVENTURE OF THE ENGINEER'S THUMB": "The Adventure of the Engineer's Thumb",
  "THE ADVENTURE OF THE NOBLE BACHELOR": "The Adventure of the Noble Bachelor",
  "THE ADVENTURE OF THE BERYL CORONET": "The Adventure of the Beryl Coronet",
  "THE ADVENTURE OF THE COPPER BEECHES": "The Adventure of the Copper Beeches",
  "SILVER BLAZE": "Silver Blaze",
  "THE YELLOW FACE": "The Yellow Face",
  "THE STOCK-BROKER'S CLERK": "The Stock-Broker's Clerk",
  "THE \"GLORIA SCOTT\"": "The Gloria Scott",
  "THE MUSGRAVE RITUAL": "The Musgrave Ritual",
  "THE REIGATE SQUIRES": "The Reigate Squires",
  "THE CROOKED MAN": "The Crooked Man",
  "THE RESIDENT PATIENT": "The Resident Patient",
  "THE GREEK INTERPRETER": "The Greek Interpreter",
  "THE NAVAL TREATY": "The Naval Treaty",
  "THE FINAL PROBLEM": "The Final Problem",
  "THE ADVENTURE OF THE EMPTY HOUSE": "The Adventure of the Empty House",
  "THE ADVENTURE OF THE NORWOOD BUILDER": "The Adventure of the Norwood Builder",
  "THE ADVENTURE OF THE DANCING MEN": "The Adventure of the Dancing Men",
  "THE ADVENTURE OF THE SOLITARY CYCLIST": "The Adventure of the Solitary Cyclist",
  "THE ADVENTURE OF THE PRIORY SCHOOL": "The Adventure of the Priory School",
  "THE ADVENTURE OF BLACK PETER": "The Adventure of Black Peter",
  "THE ADVENTURE OF CHARLES AUGUSTUS MILVERTON": "The Adventure of Charles Augustus Milverton",
  "THE ADVENTURE OF THE SIX NAPOLEONS": "The Adventure of the Six Napoleons",
  "THE ADVENTURE OF THE THREE STUDENTS": "The Adventure of the Three Students",
  "THE ADVENTURE OF THE GOLDEN PINCE-NEZ": "The Adventure of the Golden Pince-Nez",
  "THE ADVENTURE OF THE MISSING THREE-QUARTER": "The Adventure of the Missing Three-Quarter",
  "THE ADVENTURE OF THE ABBEY GRANGE": "The Adventure of the Abbey Grange",
  "THE ADVENTURE OF THE SECOND STAIN": "The Adventure of the Second Stain",
  "THE HOUND OF THE BASKERVILLES": "The Hound of the Baskervilles",
  "THE VALLEY OF FEAR": "The Valley of Fear",
  "THE ADVENTURE OF WISTERIA LODGE": "The Adventure of Wisteria Lodge",
  "THE ADVENTURE OF THE CARDBOARD BOX": "The Adventure of the Cardboard Box",
  "THE ADVENTURE OF THE RED CIRCLE": "The Adventure of the Red Circle",
  "THE ADVENTURE OF THE BRUCE-PARTINGTON PLANS": "The Adventure of the Bruce-Partington Plans",
  "THE ADVENTURE OF THE DYING DETECTIVE": "The Adventure of the Dying Detective",
  "THE DISAPPEARANCE OF LADY FRANCES CARFAX": "The Disappearance of Lady Frances Carfax",
  "THE ADVENTURE OF THE DEVIL'S FOOT": "The Adventure of the Devil's Foot",
  "HIS LAST BOW": "His Last Bow"
}

def format_content(lines):
    paras = []
    current_para = []
    
    for line in lines:
        stripped = line.strip()
        if not stripped:
            if current_para:
                paras.append(" ".join(current_para))
                current_para = []
        else:
            # Check if line is header marker (<h2>...</h2>)
            if stripped.startswith('<h2>') and stripped.endswith('</h2>'):
                if current_para:
                    paras.append(" ".join(current_para))
                    current_para = []
                paras.append(stripped) # Added as separate item
            else:
                current_para.append(stripped)
    
    if current_para:
        paras.append(" ".join(current_para))
        
    formatted = []
    for p in paras:
        # If it's our header marker, keep it as is (it's already HTML)
        if p.startswith('<h2>') and p.endswith('</h2>'):
            formatted.append(p)
            continue
            
        # Text content: escape HTML
        safe = p.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        
        # Detect Chapter/Part headers
        # Heuristic: Short, uppercase, starts with CHAPTER, PART, or Roman Numeral
        if re.match(r'^(CHAPTER [IVXLC]+|PART [IVXLC]+|[IVXLC]+\.?)$', safe, re.IGNORECASE):
             # Some are UC, some might vary.
             # The text file has "CHAPTER I" etc.
             if len(safe) < 100:
                formatted.append(f'<h3>{safe}</h3>')
             else:
                formatted.append(f'<p>{safe}</p>')
        else:
            formatted.append(f'<p>{safe}</p>')
            
    return "\n".join(formatted)

def main():
    print("Reading canon.txt...")
    chapters = []
    current_title = "Introduction"
    current_buffer = []

    try:
        with open(input_file, 'r', encoding='utf-8-sig') as f:
            lines = f.readlines()
    except FileNotFoundError:
        print(f"Error: {input_file} not found.")
        return

    for line in lines:
        stripped = line.strip()
        
        if stripped in titles_map:
            print(f"Found: {titles_map[stripped]}")
            if current_buffer:
                chapters.append({
                    "title": current_title,
                    "content": format_content(current_buffer)
                })
            current_title = titles_map[stripped]
            current_buffer = []
            
            # Add title as header to buffer, formatted specially so we can detect it
            current_buffer.append(f"<h2>{current_title}</h2>")
        else:
            current_buffer.append(line)
            
    if current_buffer:
        chapters.append({
            "title": current_title,
            "content": format_content(current_buffer)
        })
        
    # Remove introduction if too short (checking content length)
    if chapters and len(chapters[0]['content']) < 2000:
        print("Skipping short Introduction/TOC section.")
        chapters.pop(0)

    js_content = f"""export const bookTitle = "The Complete Sherlock Holmes";
export const bookAuthor = "Arthur Conan Doyle";

export const chapters = {json.dumps(chapters, indent=2)};
"""

    print(f"Writing {len(chapters)} chapters to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(js_content)
    print("Done.")

if __name__ == "__main__":
    main()

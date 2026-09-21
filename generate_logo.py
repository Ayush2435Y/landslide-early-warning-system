import subprocess

svg_content = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="100%" height="100%">
  <defs>
    <!-- Clip path to keep mountain and river inside the inner shield -->
    <clipPath id="innerShieldClip">
      <path d="M 300,98 C 390,98 465,116 480,140 C 498,240 460,370 300,505 C 140,370 102,240 120,140 C 135,116 210,98 300,98 Z" />
    </clipPath>
    <filter id="subtleShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Outer Thick Shield Outline (Deep Dark Navy Teal) -->
  <path d="M 300,70 C 410,70 500,92 518,120 C 540,240 495,400 300,550 C 105,400 60,240 82,120 C 100,92 190,70 300,70 Z" 
        fill="#07181f" 
        stroke="#051217" 
        stroke-width="8" 
        stroke-linejoin="round"/>

  <!-- Inner White Shield Border Line -->
  <path d="M 300,94 C 395,94 472,112 488,136 C 507,238 468,375 300,515 C 132,375 93,238 112,136 C 128,112 205,94 300,94 Z" 
        fill="#081b22" 
        stroke="#ffffff" 
        stroke-width="16" 
        stroke-linejoin="round"/>

  <!-- Content Group clipped inside Shield -->
  <g clip-path="url(#innerShieldClip)">
    <!-- Mountain Outlines & Facets -->
    <!-- Center Peak: Light Leaf Green Facets (Light / Sunshine) -->
    <!-- Center Peak Bold White Border Base -->
    <path d="M 300,145 L 372,250 L 400,225 L 460,305 L 395,320 L 300,320 L 205,320 L 140,305 L 200,225 L 228,250 Z" 
          fill="none" 
          stroke="#ffffff" 
          stroke-width="22" 
          stroke-linejoin="round" 
          stroke-linecap="round"/>

    <!-- Left Flanking Peak -->
    <polygon points="200,228 142,305 235,305" fill="#67ab3e" stroke="#ffffff" stroke-width="12" stroke-linejoin="round"/>
    <polygon points="200,228 235,305 258,260" fill="#437728" />
    <polygon points="170,268 200,305 230,305" fill="#203f14" />

    <!-- Right Flanking Peak -->
    <polygon points="400,228 458,305 365,305" fill="#67ab3e" stroke="#ffffff" stroke-width="12" stroke-linejoin="round"/>
    <polygon points="400,228 365,305 342,260" fill="#386820" />
    <polygon points="430,268 400,305 370,305" fill="#1b3610" />

    <!-- Tall Central Peak Upper Half (Vibrant Green) -->
    <polygon points="300,148 230,250 275,320 325,320 370,250" fill="#67ab3e" stroke="#ffffff" stroke-width="14" stroke-linejoin="round"/>

    <!-- Central Ridge Shadows (Dark Pine / Crevices) -->
    <path d="M 300,154 L 322,238 L 308,270 L 322,320 L 278,320 L 265,260 L 275,238 Z" fill="#44792a" />
    <path d="M 308,238 L 368,320 L 320,320 L 308,270 Z" fill="#152f0f" />
    <path d="M 264,258 L 278,320 L 235,320 Z" fill="#1e4014" />

    <!-- Winding Sky Blue River -->
    <!-- River Base / Flow (Starting from under mountain gap down through shield) -->
    <path d="M 374,320 
             C 340,326 312,328 280,336
             C 240,346 208,370 212,410
             C 216,445 258,460 286,470
             C 325,484 350,496 338,520
             C 330,535 305,550 280,555
             L 370,555
             C 395,540 405,515 390,488
             C 372,458 320,446 295,435
             C 272,425 264,410 268,392
             C 274,370 305,355 350,344
             C 375,338 385,328 374,320 Z"
          fill="#52a9f4" />
          
    <!-- Subtle River Highlight Waves -->
    <path d="M 230,402 C 235,385 265,372 290,364" 
          fill="none" 
          stroke="#93cdfd" 
          stroke-width="5" 
          stroke-linecap="round" 
          opacity="0.85" />
    <path d="M 285,446 C 315,456 345,470 355,488" 
          fill="none" 
          stroke="#93cdfd" 
          stroke-width="5" 
          stroke-linecap="round" 
          opacity="0.85" />
  </g>
</svg>
'''

with open("public/logo.svg", "w") as f:
    f.write(svg_content)

print("Saved public/logo.svg")

# Convert to PNG using ImageMagick
try:
    cmd = ["convert", "-background", "none", "-density", "300", "public/logo.svg", "-resize", "512x512", "public/logo.png"]
    subprocess.run(cmd, check=True)
    print("Generated public/logo.png (512x512)")
    
    # Also generate small favicon.png
    cmd_fav = ["convert", "-background", "none", "-density", "300", "public/logo.svg", "-resize", "64x64", "public/favicon.png"]
    subprocess.run(cmd_fav, check=True)
    print("Generated public/favicon.png")
except Exception as e:
    print("Error converting to PNG:", e)

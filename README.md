# Interactive Charts for our Capstone Project

Webpage available at [afiqket.github.io/zerobug](https://afiqket.github.io/zerobug)

How to reproduce the experiments:

**Claude**

  Everything was done through Claude's CLI: Claude Code. Make sure that the model is Opus 4.7, since the Opus 4.8 recently came out. 
  To run C1 we performed this command in the terminal, outside of claude code: 
    
    claude --print \
      "$(cat prompts/C1.md)

    $(cat questions/q002.md)

    --- CHART CODE ---
    $(cat data/charts/chart_001.js)

    --- DATA ---
    $(cat data/csvs/chart_001.csv)" \
      > runs/q002_claude_C1_r3.txt

  To run C3 we gave Claude Code this prompt ( this is an example for one of the charts):

    Open the chart at https://observablehq.com/d/9afd123a63309685 using your browser tool, answer the question in questions/q_449.md, and save the output to runs/C3/q449_claude_C3_r1.txt

  **Gemini**

  Every run was done in CLI: Gemini CLI. The model to be used is Gemini 3.1 Pro Preview. To run C1:
    
  For example, for chart 1 - Make sure to have chart1.js, chart1.csv and chart1_questions.csv ready. 
  Then, to run C1, run this in terminal:
      
      python scripts/prompt.py --questions questions/chart1_questions.csv

  To run C3, we gave Gemini Code this prompt. For example for chart 1 question 1:
  
      Open questions/001.txt, open the chart using the URL, save the answer to runs/C3/q001_gemini_c3_r1.txt
    

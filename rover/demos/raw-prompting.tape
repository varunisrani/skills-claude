# Demo used for https://endor.dev/blog/how-to-prompt-effectively-for-coding

Output raw-prompting.gif
Output raw-prompting.webm

Require rover

# Styling
Set WindowBar Colorful
Set Margin 20
Set MarginFill "#107e7a"
Set BorderRadius 10
Set Padding 30

Set Shell "bash"
Set FontSize 20
Set FontFamily "FiraCode Nerd Font Mono"
Set LetterSpacing 0.8
Set Width 1800
Set Height 800
Set TypingSpeed 50ms
Set Framerate 24

Hide
Type "cd ../" Enter
Type "clear" Enter
Show

Sleep 250ms
Type "# Ask the agent to familiarize itself with the code"
Sleep 500ms Enter
Type "claude"
Enter
Sleep 2s
Type "I am working on extracting the agent workflow definition from the @packages/cli/ package into a more formal and separate library under @packages/agent/. I want to develop the schema definition and the library to load it. For now, I just want you to get familiar with the way the CLI sets and loads the different AI workflow steps from @packages/cli/src/lib/prompts/ and @packages/cli/src/lib/setup.ts and explain it to me in a summarized form."
Sleep 500ms Enter
Sleep 120s

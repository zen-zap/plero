# plero

Code-editor with AI code-completion using **OPENAI** API.

Yes, you may find a lot of the parts written by AI. 

I'm not a web developer. Any code from AI has been reviewed and iterated upon by me.

## How it Looks: (in Arch -- hyprland compositor)
<img width="1914" height="1055" alt="image" src="https://github.com/user-attachments/assets/9e2b04c5-01cc-4063-b052-0d25b0e56752" />



Appearance may vary depending on window manager, compositor, and theme.

## Current Stage:

You can get ghost completion suggestions when writing code in rust and typescript. Of course, it is not extensively tested with different types on syntax but it works (hopefully).

## Usage:

You'll need to set up your API keys:

1. Create the config directory: `mkdir -p ~/.plero_keys`
2. Create the env file: `touch ~/.plero_keys/.env`
3. Add your API keys to `~/.plero_keys/.env`:
   ```
   OPENAI_API_KEY=your_openai_key_here
   TAVILY_API_KEY=your_tavily_key_here
   ```

See `demo.env` at the project root for reference.

The services are paid and I can't afford to provide any as a student.

## Contributions:

I won't be going much further with this project once I'm done with the basic working features. I started this with the intention to learn web dev and agentic AI.
If you want to work on something or have any feature you wanna integrate, feel free to reach out to me.
PRs are welcome.

# EXTENOVA 🔬

> A powerful research assistant Chrome extension built for INFOMATRIX 2025 competition by Skillset Team

EXTENOVA enhances your research workflow by providing AI-powered analysis of text, screenshots, and GitHub repositories using state-of-the-art language models.


## Features

- **Multi-Model Analysis**: Leverage multiple AI models including Gemma and Microsoft Phi-2
- **Versatile Input Methods**:
  - Text analysis with file upload support
  - Screen capture and analysis
  - GitHub repository insights
- **Task-Specific Analysis**:
  - Text summarization
  - Key highlights extraction
  - Keyword identification
  - Custom analysis options

## Setup

1. Clone the repository:
```bash
git clone https://github.com/your-username/extenova.git
cd extenova
```

2. **Important**: Set up your Hugging Face API Token
   - Create an account at [Hugging Face](https://huggingface.co)
   - Generate an API token in your account settings
   - Replace the empty `HF_TOKEN` constant in `popup.js`:
   ```javascript
   const HF_TOKEN = 'your-token-here';
   ```

3. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the extension directory

## Usage

1. Click the EXTENOVA icon in your Chrome toolbar
2. Select an AI model from the dropdown
3. Choose your input method:
   - Paste text directly
   - Upload a file
   - Capture a screenshot
   - Analyze a GitHub repository
4. Select your analysis task
5. Click the appropriate analysis button to get results

## Tech Stack

- JavaScript (ES6+)
- Chrome Extensions API
- Hugging Face Inference API
- GitHub API
- Modern CSS

## Team

Built by Skillset Team for INFOMATRIX 2025
- [Visit our website](https://skillset.edu.kz/)
- Contact: your.email@example.com

---

*Built with 💡 by Skillset Team | INFOMATRIX 2025*

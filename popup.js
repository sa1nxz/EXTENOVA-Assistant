// Constants
const API_ENDPOINTS = {
  'google/gemma-2-2b-it': 'https://api-inference.huggingface.co/models/google/gemma-2-2b-it',
  'google/gemma-2-9b-it': 'https://api-inference.huggingface.co/models/google/gemma-2-9b-it',
  'google/gemma-7b': 'https://api-inference.huggingface.co/models/google/gemma-7b',
  'microsoft/phi-2': 'https://api-inference.huggingface.co/models/microsoft/phi-2',
  'Salesforce/blip-image-captioning-large': 'https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large'
};

const HF_TOKEN = '';

// UI Elements
const elements = {
  modelSelect: document.getElementById('modelSelect'),
  textInput: document.getElementById('textInput'),
  fileInput: document.getElementById('fileInput'),
  analyzeText: document.getElementById('analyzeText'),
  captureScreen: document.getElementById('captureScreen'),
  analyzeScreenshot: document.getElementById('analyzeScreenshot'),
  screenshotPreview: document.getElementById('screenshotPreview'),
  preview: document.getElementById('preview'),
  repoUrl: document.getElementById('repoUrl'),
  analyzeRepo: document.getElementById('analyzeRepo'),
  results: document.getElementById('results'),
  resultContent: document.getElementById('resultContent'),
  loading: document.getElementById('loading'),
  taskSelect: document.getElementById('taskSelect'),
  pinButton: document.getElementById('pinButton')
};

// Tab handling
document.querySelectorAll('.tab-btn').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    
    const tabId = button.getAttribute('data-tab');
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.remove('active');
    });
    document.getElementById(`${tabId}Tab`).classList.add('active');
  });
});

// Initialize models
const models = [
  { id: 'google/gemma-2-2b-it', name: 'Gemma (2.2B)', type: 'text' },
  { id: 'google/gemma-2-9b-it', name: 'Gemma (2.9B)', type: 'text' },
  { id: 'google/gemma-7b', name: 'Gemma (7B)', type: 'text' },
  { id: 'microsoft/phi-2', name: 'Microsoft Phi 2', type: 'text' }
];

// Initialize models in dropdown
function initializeModels() {
  models.forEach(model => {
    const option = document.createElement('option');
    option.value = model.id;
    option.textContent = model.name;
    elements.modelSelect.appendChild(option);
  });
}

// Text Analysis
elements.analyzeText.addEventListener('click', async () => {
  const text = elements.textInput.value.trim();
  if (!text) {
    showError('Please enter some text to analyze');
    return;
  }
  await analyzeContent(text);
});

// File Upload
elements.fileInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    showLoading();
    const text = await file.text();
    elements.textInput.value = text;
    hideLoading();
  } catch (error) {
    hideLoading();
    showError('Error reading file');
  }
});

// Screen Capture
elements.captureScreen.addEventListener('click', () => {
  showLoading();
  try {
    chrome.runtime.sendMessage({ action: 'captureScreen' }, (response) => {
      try {
        if (response?.error) {
          showError(response.error);
        } else if (response?.dataUrl) {
          elements.preview.src = response.dataUrl;
          elements.preview.style.width = '100%';
          elements.screenshotPreview.classList.remove('hidden');
        } else {
          showError('Failed to capture screenshot');
        }
      } catch (error) {
        showError('Screenshot processing failed');
      } finally {
        hideLoading();
      }
    });
  } catch (error) {
    showError('Failed to initiate screen capture');
    hideLoading();
  }
});

elements.analyzeScreenshot.addEventListener('click', async () => {
  const dataUrl = elements.preview.src;
  if (!dataUrl) {
    showError('No screenshot to analyze');
    return;
  }
  await analyzeContent(dataUrl, 'image');
});

// GitHub Analysis
elements.analyzeRepo.addEventListener('click', async () => {
  const repoUrl = elements.repoUrl.value.trim();
  if (!repoUrl) {
    showError('Please enter a GitHub repository URL');
    return;
  }
  
  try {
    showLoading();
    const repoData = await fetchGitHubRepo(repoUrl);
    await analyzeContent(JSON.stringify(repoData));
    hideLoading();
  } catch (error) {
    hideLoading();
    showError('Failed to analyze repository');
  }
});

// Core Analysis Function
async function analyzeContent(content, inputType = 'text', forcedModelId = '') {
  showLoading();
  try {
    if (inputType === 'image') {
      const blob = await dataURLToBlob(content);
      const responseData = await queryHuggingFaceImage('Salesforce/blip-image-captioning-large', blob);
      displayResults(responseData, 'image');
      return;
    }

    const selectedModelId = forcedModelId || elements.modelSelect.value;
    if (!selectedModelId) {
      throw new Error('Please select a model');
    }

    const taskType = elements.taskSelect.value;
    let systemPrompt = '';
    
    switch (taskType) {
      case 'summary':
        systemPrompt = 'Generate a concise summary. Response:';
        break;
      case 'highlights':
        systemPrompt = 'Extract key highlights. Response:';
        break;
      case 'keywords':
        systemPrompt = 'Extract important keywords. Response:';
        break;
      default:
        systemPrompt = 'Analyze and provide insights. Response:';
    }

    const prompt = `${systemPrompt}\n\n${content}`;
    const responseData = await queryHuggingFace(selectedModelId, prompt);
    
    // Clean up the response by removing the original prompt and system message
    if (responseData[0]?.generated_text) {
      responseData[0].generated_text = responseData[0].generated_text
        .replace(prompt, '')
        .replace(systemPrompt, '')
        .trim();
    }
    
    displayResults(responseData, 'text');
  } catch (error) {
    showError(error.message || 'Analysis failed');
  } finally {
    hideLoading();
  }
}

function displayResults(responseData, modelType) {
  let output = '';
  if (Array.isArray(responseData) && responseData[0]?.generated_text) {
    output = responseData[0].generated_text;
  } else if (Array.isArray(responseData) && responseData[0]?.caption) {
    output = responseData[0].caption;
  } else {
    output = JSON.stringify(responseData, null, 2);
  }

  // Add task type header to results
  const taskType = elements.taskSelect.value;
  const taskHeader = taskType !== 'other' ? `<h3>${taskType.charAt(0).toUpperCase() + taskType.slice(1)}</h3>` : '';
  
  elements.resultContent.innerHTML = `
    ${taskHeader}
    <pre class="whitespace-pre-wrap">${output}</pre>
  `;
  elements.results.classList.remove('hidden');
}

// Hugging Face API call function
async function queryHuggingFace(modelId, input) {
  try {
    const response = await fetch(API_ENDPOINTS[modelId], {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: input,
        parameters: {
          max_length: 500,
          temperature: 0.7,
          top_p: 0.95,
          do_sample: true
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(`API request failed: ${error.message}`);
  }
}

// For image models, we POST the raw blob
async function queryHuggingFaceImage(modelId, blob) {
  try {
    const response = await fetch(API_ENDPOINTS[modelId], {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`
      },
      body: blob
    });

    if (!response.ok) {
      throw new Error(`Image API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Image API request failed: ${error.message}`);
  }
}

// Convert dataUrl to Blob
function dataURLToBlob(dataUrl) {
  const base64Index = dataUrl.indexOf(',') + 1;
  const base64 = dataUrl.slice(base64Index);
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: 'image/png' });
}

// GitHub API Helper
async function fetchGitHubRepo(repoUrl) {
  const repoPath = new URL(repoUrl).pathname.slice(1);
  const response = await fetch(`https://api.github.com/repos/${repoPath}`, {
    headers: {
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch repository data');
  }
  
  return response.json();
}

// UI Helpers
function showLoading() {
  elements.loading.classList.remove('hidden');
}

function hideLoading() {
  elements.loading.classList.add('hidden');
}

function showError(message) {
  hideLoading();
  elements.resultContent.innerHTML = `<div class="text-red-500">${message}</div>`;
  elements.results.classList.remove('hidden');
}

// Pin functionality
let isPinned = false;

function togglePin() {
  isPinned = !isPinned;
  elements.pinButton.classList.toggle('active');
  
  if (isPinned) {
    chrome.windows.getCurrent(window => {
      chrome.windows.update(window.id, {
        focused: true,
        state: 'normal',
        type: 'popup',
        width: 400,
        height: 600
      });
    });
  }
}

elements.pinButton.addEventListener('click', togglePin);

// Add this to prevent window from closing when clicking outside
window.addEventListener('blur', () => {
  if (isPinned) {
    window.focus();
  }
});

// Initialize
document.addEventListener('DOMContentLoaded', initializeModels);
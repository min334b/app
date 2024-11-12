// hooks/useRenderImages.ts
import { Url } from 'next/dist/shared/lib/router/router';
import { useState } from 'react';

const getSearchResponse = async (keyword: string) => {
  // api/google-searchにPOSTリクエストを送信
  const response = await fetch('/api/google-search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ keyword }),
  });
  // imagesを取得
  const data = await response.json();
  return data.images;
};

const getGeminiConfirmResponse = async (keyword: string, image: Url) => {
  // api/gemini-confirmにPOSTリクエストを送信
  const response = await fetch('/api/gemini-confirm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ keyword }),
  });
  // contentを取得
  const data = await response.json();
  return data.content;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const useRenderImages = () => {
  const [images, setImages] = useState<string[]>([]);
  const isValidKeyword = (keyword: string) => {
    const invalidPattern = /[\n\r\t]/;
    return !invalidPattern.test(keyword);
  };

  const renderImages = async (keyword: string) => {
    console.log("renderImages called");
    if (!isValidKeyword(keyword) || keyword === "") {
      console.log(`Invalid keyword skipped: ${keyword}`);
    }
    // document.querySelectorAll('.search-result, .keyword').forEach(element => element.remove());
    // Remove any existing flexContainer before creating a new one
    const existingContainer = document.querySelector('.flex-container');
    if (existingContainer) {
        existingContainer.remove();
    }
    try {
      const images = await getSearchResponse(keyword);
      setImages(prev => [...prev, ...images]);
      console.log(images);

      const flexContainer = document.createElement('div');
      flexContainer.classList.add('flex-container');
      flexContainer.style.display = 'flex';
      flexContainer.style.flexDirection = 'raw';
      flexContainer.style.alignItems = 'center';
      flexContainer.style.width = '33%';

      const keywordElement = document.createElement('p');
      keywordElement.textContent = keyword;
      keywordElement.classList.add('keyword');
      flexContainer.appendChild(keywordElement);

      images.forEach((image: string, index: number) => {
        // getGeminiConfirmResponse(keyword, image);

        const img = document.createElement('img');
        img.src = image;
        img.alt = `Image ${index + 1}`;
        img.classList.add('search-result');
        img.style.width = '100%';
        img.style.height = 'auto';
        img.style.marginBottom = '10px';
        img.style.background = 'white';
        img.onload = () => {
          const maxWidth = window.innerWidth / 3;
          const ratio = maxWidth / img.width;
          const newHeight = img.height * ratio;
          img.width = maxWidth;
          img.height = newHeight;
        };
        flexContainer.appendChild(img);
      });

      // flexContainer.style.position = 'absolute';
      // flexContainer.style.top = '20%';
      // flexContainer.style.left = '0';
      // flexContainer.style.height = '100%';
      // document.body.appendChild(flexContainer);
      flexContainer.style.position = 'relative';
      flexContainer.style.marginTop = '20px'; // Add some margin from previous content
      document.body.appendChild(flexContainer);

      await sleep(3000);

    } catch (error) {
      console.error(error);
    }
    
  };

  return { renderImages, images };
};

export default useRenderImages;

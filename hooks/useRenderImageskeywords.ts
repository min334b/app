// hooks/useRenderImages.ts
import { Url } from "next/dist/shared/lib/router/router";
import { useState } from "react";

const getSearchResponse = async (keyword: string) => {
  // api/google-searchにPOSTリクエストを送信
  const response = await fetch("/api/google-search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ keyword }),
  });
  // imagesを取得
  const data = await response.json();
  return data.images;
};

const getGeminiConfirmResponse = async (keyword: string, image: Url) => {
  // api/gemini-confirmにPOSTリクエストを送信
  const response = await fetch("/api/gemini-confirm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ keyword }),
  });
  // contentを取得
  const data = await response.json();
  return data.content;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const useRenderImageskeywords = () => {
  const [images, setImages] = useState<string[]>([]);
  const isValidKeyword = (keyword: string) => {
    const invalidPattern = /[\n\r\t]/;
    return !invalidPattern.test(keyword);
  };

  const renderImageskeywords = async (keywords: string[]) => {
    // 既存の画像や要素をすべて削除
    document.querySelectorAll(".flex-container").forEach((element) => element.remove());

    console.log("keywords:" + keywords);

    // 拡大表示を管理するための状態
    let isPaused = false;

    // 拡大表示の作成
    const createImageModal = (imageSrc: string) => {
      const modal = document.createElement("div");
      modal.classList.add("image-modal");
      modal.style.position = "fixed";
      modal.style.top = "0";
      modal.style.left = "0";
      modal.style.width = "100vw";
      modal.style.height = "100vh";
      modal.style.backgroundColor = "rgba(1, 1, 1, 0.8)";
      modal.style.display = "flex";
      modal.style.justifyContent = "center";
      modal.style.alignItems = "center";
      modal.style.zIndex = "1000";

      const img = document.createElement("img");
      img.src = imageSrc;
      img.style.maxWidth = "80%";
      img.style.maxHeight = "80%";
      img.style.boxShadow = "0 0 20px white";
      img.style.borderRadius = "10px";
      img.style.backgroundColor = "white";

      const closeButton = document.createElement("button");
      closeButton.textContent = "×";
      closeButton.style.position = "absolute";
      closeButton.style.top = "10px";
      closeButton.style.right = "10px";
      closeButton.style.fontSize = "24px";
      closeButton.style.color = "white";
      closeButton.style.background = "transparent";
      closeButton.style.border = "none";
      closeButton.style.cursor = "pointer";

      closeButton.addEventListener("click", () => {
        modal.remove();
        isPaused = false; // 拡大表示解除
      });

      modal.appendChild(img);
      modal.appendChild(closeButton);
      document.body.appendChild(modal);
    };

    for (let i = 0; i < keywords.length; i++) {
      if (isPaused) {
        await new Promise((resolve) => {
          const interval = setInterval(() => {
            if (!isPaused) {
              clearInterval(interval);
              resolve(null);
            }
          }, 100);
        });
      }

      let keyword = keywords[i];
      console.log("renderImages called");
      if (!isValidKeyword(keyword) || keyword === "") {
        console.log(`Invalid keyword skipped: ${keyword}`);
        continue;
      }

      try {
        const images = await getSearchResponse(keyword);
        setImages((prev) => [...prev, ...images]);
        console.log(images);

        const flexContainer = document.createElement("div");
        flexContainer.classList.add("flex-container");
        flexContainer.style.display = "flex";
        flexContainer.style.flexDirection = "row";
        flexContainer.style.alignItems = "center";
        flexContainer.style.width = "33%";
        flexContainer.style.height = "20%";

        // const keywordElement = document.createElement("p");
        // keywordElement.textContent = keyword;
        // keywordElement.classList.add("keyword");
        // flexContainer.appendChild(keywordElement);

        images.forEach((image: string, index: number) => {
          const img = document.createElement("img");
          img.src = image;
          img.alt = `Image ${index + 1}`;
          img.classList.add("search-result");
          img.style.width = "auto";
          img.style.height = "20vh";
          img.style.marginBottom = "10px";
          img.style.background = "white";

          img.onload = () => {
            const targetHeight = window.innerHeight * 0.2;
            const ratio = targetHeight / img.height;
            img.height = targetHeight;
            img.width = img.width * ratio;
          };

          img.addEventListener("click", () => {
            isPaused = true; // 画像の更新を一時停止
            createImageModal(image);
          });

          flexContainer.appendChild(img);
        });

        flexContainer.style.position = "relative";
        flexContainer.style.marginTop = "20px";
        document.body.appendChild(flexContainer);

      } catch (error) {
        console.error(error);
      }
    }
  };

  return { renderImageskeywords, images };
};

export default useRenderImageskeywords;

import { NextRequest } from "next/server";

const getSearchResponse = async (keyword: any) => {
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  const CUSTOM_SEARCH_ENGINE_ID = process.env.CUSTOM_SEARCH_ENGINE_ID;

  const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${CUSTOM_SEARCH_ENGINE_ID}&q=${keyword}&lr=lang_ja&num=3&searchType=image`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.items) {
      throw new Error('No items found in response');
    }

    const images = data.items.map(item => item.link);
    console.log(images);
    return images;
  } catch (error) {
    console.error('Error fetching search results:', error);
    throw error;
  }
};

export const POST = async(req: NextRequest) => {
    const body = await req.json();
    const { keyword } = body;
    console.log(keyword);

  if (!keyword) {
    Response.json({ error: 'Keyword is required' });
    return;
  }

    try {
        const images = await getSearchResponse(keyword);
        return Response.json({ images });
    } catch (error) {
        return Response.json({ error: 'Failed to fetch search results' });
    }
}

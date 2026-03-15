export type Tag = { 
  type: "year" | "language" | "quality" | "other"; 
  value: string 
};

export type SearchResultItem = {
  url: string;
  title: string;
  size: string;
  image: string;
  tags: Tag[];
  download_link?: string;
};
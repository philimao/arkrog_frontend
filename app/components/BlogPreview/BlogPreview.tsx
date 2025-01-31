import { useAppDataStore } from "~/stores/appDataStore";

export default function BlogPreview() {
  const { recommendArticles } = useAppDataStore();
  if (!recommendArticles) return null;
  return (
    <div className="grid grid-cols-2 gap-4">
      {recommendArticles.map((article) => (
        <div key={article.url} className="p-2 bg-semi-black">
          <div className="w-full aspect-video p-2">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="overflow-hidden relative"
            >
              <img
                className="h-full w-full object-cover"
                src={article.img}
                alt="img"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
              />
            </a>
          </div>
          <hr className="mt-4 opacity-50" />
          <div className="p-2 flex items-center">
            <div className="flex items-center me-4 flex-shrink-0">
              <span>
                <img
                  className="h-8 w-8 me-3"
                  style={{ borderRadius: "50%" }}
                  src={article.raiderImage}
                  alt="avatar"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                />
              </span>
              <span className="text-ak-blue whitespace-nowrap">
                {article.raider}
              </span>
            </div>
            <div className="text-lg font-bold">{article.title}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

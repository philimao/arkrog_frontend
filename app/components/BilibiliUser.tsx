interface BilibiliUserProps {
  mid: string;
  name: string;
  face: string;
  room_id?: string;
}

export default function BilibiliUser({ mid, name, face, room_id }: BilibiliUserProps) {
  const displayName = room_id ? `${name}的直播间` : name;
  const handleClick = () => {
    if (room_id) {
      window.open(`https://live.bilibili.com/${room_id}`, "_blank");
    } else {
      window.open(`https://space.bilibili.com/${mid}`, "_blank");
    }
  };

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-mid-gray transition-colors"
    >
      <div className="w-10 h-10 rounded-full border border-white overflow-hidden flex-shrink-0">
        <img
          src={face}
          alt={name}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          className="w-full h-full object-cover"
        />
      </div>
      <span className="text-white">{displayName}</span>
    </div>
  );
}

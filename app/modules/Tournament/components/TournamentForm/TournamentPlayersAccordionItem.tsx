import { AccordionItem } from "@heroui/react";
import { CloseIcon, LinkIcon } from "~/components/Icons";
import type { TournamentData, TournamentPlayer } from "~/types/tournamentsData";

interface TournamentPlayersAccordionItemProps {
  formData: TournamentData;
  setFormData: React.Dispatch<React.SetStateAction<TournamentData>>;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  editingPlayer: TournamentPlayer | undefined;
  setEditingPlayer: React.Dispatch<React.SetStateAction<TournamentPlayer | undefined>>;
}

export default function TournamentPlayersAccordionItem({
  formData,
  setFormData,
  handleKeyDown,
  editingPlayer,
  setEditingPlayer,
}: TournamentPlayersAccordionItemProps) {
  return (
    <>
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {formData.players && formData.players.length > 0 && formData.players.map((player, index) => (
            <div
              key={index}
              className={`px-2 py-1 rounded-md ${editingPlayer === player ? "bg-ak-blue text-black" : (!player.name || player.name === "请点击填写选手") ? "bg-ak-dark-red text-white" : "bg-mid-gray text-white"}`}
            >
              <button
                onClick={(e) => {
                  e.preventDefault();
                  editingPlayer === player ? setEditingPlayer(undefined) : setEditingPlayer(player);
                }}
              >
                {player.name}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  if (player === editingPlayer)
                    setEditingPlayer(undefined);
                  const newPlayers = formData.players!.filter(
                    (_, i) => i !== index,
                  );
                  setFormData((prev) => ({
                    ...prev,
                    players: newPlayers,
                  }));
                }}
                className="ml-1 rounded-md p-1 hover:text-white hover:bg-ak-red"
              >
                <CloseIcon width="0.7rem" height="0.7rem" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              const newPlayer = {
                mid: "invalid",
                name: "请点击填写选手",
                face: "",
                games: [],
              };
              setFormData((prev) => ({
                ...prev,
                players: [...(prev.players || []), newPlayer],
              }));
            }}
            className="px-2 py-1 text-ak-blue bg-mid-gray hover:text-black hover:bg-ak-blue rounded-md"
          >
            + 添加选手
          </button>
        </div>
      </div>
      {editingPlayer && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full border-t-1 border-t-mid-gray pt-2 mb-2">
          <div className="w-full">
            <label className="block text-sm font-light mb-1">
              选手名字 <span className="text-ak-red">*</span>
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={editingPlayer.name}
                placeholder="选手名字"
                onChange={(e) => {
                  const newPlayers = [...formData.players!];
                  newPlayers.find((p) => p === editingPlayer)!.name =
                    e.target.value;
                  setFormData((prev) => ({ ...prev, players: newPlayers }));
                }}
                onKeyDown={handleKeyDown}
                className="px-3 py-2 focus:outline-ak-blue grow"
                maxLength={32}
                required
              />
              <button
                type="button"
                onClick={(e) => {
                  // call bilibili API
                }}
                className="rounded-md px-2 text-black bg-ak-blue inline-flex items-center gap-1 h-6"
              >
                <LinkIcon /> 连接bilibili
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-light mb-1">
              选手预览
            </label>
            <div className="bg-mid-gray p-2">
              <p>这里放bilibili头像😊</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-light mb-1">
              所属队伍
            </label>
            <div className="bg-mid-gray p-2">
              <p>这里是队伍dropwdown select</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-light mb-1">
              自定义内容 key
            </label>
            <div className="bg-mid-gray p-2">
              <p>自定义内容 value</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
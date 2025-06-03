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
          {formData.players &&
            formData.players.length > 0 &&
            formData.players.map((player, index) => (
              <div
                key={index}
                className={`p-2 w-[117px] relative rounded-md cursor-pointer ${editingPlayer === player ? "bg-ak-blue text-black" : !player.name || player.name === "点击填写选手" ? "bg-ak-dark-red text-white" : "bg-mid-gray text-white"}`}
                onClick={(e) => {
                  e.preventDefault();
                  editingPlayer === player ? setEditingPlayer(undefined) : setEditingPlayer(player);
                }}
              >
                <div
                  className={`w-16 h-16 aspect-square flex items-center justify-center ${editingPlayer === player ? "bg-mid-gray text-white" : "bg-light-gray text-black"}`}
                >
                  {player.face ? (
                    <img src={player.face} alt="avatar" referrerPolicy="no-referrer" crossOrigin="anonymous" />
                  ) : (
                    <p className="text-5xl">{player.name[0]}</p>
                  )}
                </div>
                <div className="pt-1 break-all">{player.name}</div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    if (player === editingPlayer) setEditingPlayer(undefined);
                    const newPlayers = formData.players!.filter((_, i) => i !== index);
                    setFormData((prev) => ({
                      ...prev,
                      players: newPlayers,
                    }));
                  }}
                  className="ml-1 rounded-md p-1 hover:text-white hover:bg-ak-red absolute top-1 right-1"
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
                name: "点击填写选手",
                face: "",
                games: [],
                customPlayerValues: {},
              };
              setFormData((prev) => ({
                ...prev,
                players: [...(prev.players || []), newPlayer],
              }));
            }}
            className="p-2 w-[117px] text-ak-blue bg-mid-gray hover:text-black hover:bg-ak-blue rounded-md"
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
                  newPlayers.find((p) => p === editingPlayer)!.name = e.target.value;
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
            <label className="block text-sm font-light mb-1">选手预览</label>
            <div className="bg-mid-gray p-2">
              <p>这里放bilibili头像😊</p>
            </div>
          </div>

          {formData.type === "team" && (
            <div>
              <label className="block text-sm font-light mb-1">
                所属队伍 <span className="text-ak-red">*</span>
              </label>
              <select
                name="playerTeam"
                value={formData.teams?.find((team) => team.members.includes(editingPlayer.name))?.name}
                onChange={(e) => {
                  const newTeams = [...formData.teams!];
                  newTeams
                    .find((t) => t.members.includes(editingPlayer.name))
                    ?.members.splice(
                      newTeams
                        .find((t) => t.members.includes(editingPlayer.name))
                        ?.members.indexOf(editingPlayer.name)!,
                      1,
                    );
                  newTeams.find((t) => t.name === e.target.value)?.members.push(editingPlayer.name);
                  setFormData((prev) => ({
                    ...prev,
                    teams: newTeams,
                  }));
                }}
                className="w-full px-3 py-2 focus:outline-ak-blue cursor-pointer"
                required
              >
                {formData.teams?.map((team) => {
                  return (
                    <option key={team.id} value={team.name}>
                      {team.name}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-light mb-1">自定义内容 key</label>
            <div className="bg-mid-gray p-2">
              <p>自定义内容 value</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

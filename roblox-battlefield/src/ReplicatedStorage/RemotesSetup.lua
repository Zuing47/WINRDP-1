--[[
	RemotesSetup (ModuleScript)
	Local: ReplicatedStorage

	Cria (no servidor) e devolve (no cliente) os RemoteEvents usados
	para comunicacao cliente <-> servidor.

	Uso:
		local Remotes = require(ReplicatedStorage.RemotesSetup)
		Remotes.Punch        -- pedido de soco
		Remotes.UsePower     -- pedido de poder  (envia o nome do poder)
		Remotes.Effect       -- servidor avisa clientes para tocar efeitos visuais
		Remotes.StatsChanged -- servidor envia vida/energia para a UI do dono
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local FOLDER_NAME = "BattlefieldRemotes"
local REMOTE_NAMES = { "Punch", "UsePower", "Effect", "StatsChanged" }

local function getOrCreateFolder()
	local folder = ReplicatedStorage:FindFirstChild(FOLDER_NAME)
	if folder then
		return folder
	end

	-- So o servidor cria. O cliente apenas espera a pasta replicar.
	if RunService:IsServer() then
		folder = Instance.new("Folder")
		folder.Name = FOLDER_NAME
		folder.Parent = ReplicatedStorage
	else
		folder = ReplicatedStorage:WaitForChild(FOLDER_NAME)
	end

	return folder
end

local Remotes = {}

local folder = getOrCreateFolder()

for _, name in ipairs(REMOTE_NAMES) do
	local remote = folder:FindFirstChild(name)
	if not remote then
		if RunService:IsServer() then
			remote = Instance.new("RemoteEvent")
			remote.Name = name
			remote.Parent = folder
		else
			remote = folder:WaitForChild(name)
		end
	end
	Remotes[name] = remote
end

return Remotes

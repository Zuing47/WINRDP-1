--[[
	CombatClient (LocalScript)
	Local: StarterPlayer > StarterPlayerScripts

	Captura a entrada do jogador e PEDE ao servidor para atacar.
	Nao aplica dano aqui (isso e responsabilidade do servidor).

	Controles:
	  - Botao esquerdo do mouse  -> Soco
	  - Q  -> Bola de fogo
	  - E  -> Onda de choque
	  - F  -> Dash (avanco)
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local UserInputService = game:GetService("UserInputService")

local Config = require(ReplicatedStorage:WaitForChild("GameConfig"))
local Remotes = require(ReplicatedStorage:WaitForChild("RemotesSetup"))

local player = Players.LocalPlayer

-- Mapeia tecla -> nome do poder, lendo direto do Config.
local keyToPower = {}
for powerName, cfg in pairs(Config.Powers) do
	if cfg.Key then
		keyToPower[string.upper(cfg.Key)] = powerName
	end
end

-- Cooldown leve no cliente so para nao spammar o servidor.
local lastPunchRequest = 0

local function requestPunch()
	if os.clock() - lastPunchRequest < Config.Punch.Cooldown * 0.9 then return end
	lastPunchRequest = os.clock()
	Remotes.Punch:FireServer()
end

UserInputService.InputBegan:Connect(function(input, gameProcessed)
	if gameProcessed then return end -- ignora cliques na UI/chat

	-- Soco com clique esquerdo.
	if input.UserInputType == Enum.UserInputType.MouseButton1 then
		requestPunch()
		return
	end

	-- Poderes pelas teclas.
	if input.UserInputType == Enum.UserInputType.Keyboard then
		local keyName = input.KeyCode.Name:upper()
		local powerName = keyToPower[keyName]
		if powerName then
			Remotes.UsePower:FireServer(powerName)
		end
	end
end)

-- Suporte basico para toque (mobile): toca na tela = soco.
UserInputService.TouchTap:Connect(function(_, gameProcessed)
	if gameProcessed then return end
	requestPunch()
end)

print("[Battlefield] CombatClient pronto. Clique = soco | Q/E/F = poderes.")

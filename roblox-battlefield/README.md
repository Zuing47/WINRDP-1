# Roblox Battlefield — Soco e Poderes

Jogo de campo de batalha para Roblox onde o personagem pode **dar socos** e
**soltar poderes** (bola de fogo, onda de choque e dash). Toda a lógica de dano
roda no **servidor** (autoritativo), evitando trapaças — o cliente apenas
**pede** para atacar.

## Controles

| Ação | Tecla |
|------|-------|
| Soco | Clique esquerdo do mouse (ou toque na tela no mobile) |
| Bola de fogo | `Q` |
| Onda de choque | `E` |
| Dash (avanço) | `F` |

A interface mostra barras de **Vida** e **Energia**. Poderes consomem energia,
que regenera com o tempo.

## Estrutura dos arquivos

```
src/
├── ReplicatedStorage/
│   ├── GameConfig.lua        (ModuleScript) — todos os valores de balanceamento
│   └── RemotesSetup.lua      (ModuleScript) — cria/obtém os RemoteEvents
├── ServerScriptService/
│   └── CombatServer.server.lua   (Script)  — dano, cooldown, energia, poderes
└── StarterPlayer/StarterPlayerScripts/
    ├── CombatClient.client.lua   (LocalScript) — captura mouse/teclas
    ├── EffectsClient.client.lua  (LocalScript) — efeitos visuais
    └── HUDClient.client.lua      (LocalScript) — barras de vida/energia
```

## Como instalar no Roblox Studio (manual)

1. Abra o Roblox Studio e crie um lugar (Baseplate serve).
2. No **Explorer**, crie os objetos seguindo a estrutura acima:
   - Em `ReplicatedStorage`: adicione dois **ModuleScript** chamados
     `GameConfig` e `RemotesSetup` e cole o conteúdo dos arquivos correspondentes.
   - Em `ServerScriptService`: adicione um **Script** chamado `CombatServer`
     e cole o conteúdo de `CombatServer.server.lua`.
   - Em `StarterPlayer > StarterPlayerScripts`: adicione três **LocalScript**
     (`CombatClient`, `EffectsClient`, `HUDClient`) com o conteúdo respectivo.
3. Aperte **Play**. Use dois clientes (Test > Players: 2) para ver o combate
   entre jogadores.

> Importante: o sufixo `.server.lua` indica um **Script** (servidor) e
> `.client.lua` indica um **LocalScript** (cliente). Os `.lua` em
> `ReplicatedStorage` são **ModuleScript**.

## Como instalar via Rojo (recomendado)

Se você usa [Rojo](https://rojo.space/) para sincronizar código com o Studio:

1. Instale o Rojo (`aftman` ou o plugin do Studio).
2. Na raiz `roblox-battlefield/`, rode:
   ```
   rojo serve
   ```
3. No Studio, conecte pelo plugin do Rojo. O arquivo `default.project.json`
   já mapeia as pastas para os serviços corretos.

## Ajustando o balanceamento

Quase tudo (dano, alcance, cooldown, custo de energia, cores, raio de explosão)
está em `src/ReplicatedStorage/GameConfig.lua`. Edite os números lá para
deixar o jogo mais rápido, mais forte, etc. — sem mexer na lógica.

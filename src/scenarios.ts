export type FTANodeType = "event" | "basic_event";
export type FTAGateType = "AND" | "OR";

export type TreeNode = {
    id: string;
    label: string;
    type: FTANodeType;
    gateType?: FTAGateType; // Only for 'event' type that has children
    children?: TreeNode[];
    description?: string;
};

export type Scenario = {
    id: string;
    title: string;
    rootNode: TreeNode;
};

export const scenarios: Scenario[] = [
    {
        id: "fcc-catalyst-circulation",
        title: "Circulação de Catalisador Errática",
        rootNode: {
            id: "root-circ",
            label: "Circulação de catalisador limitada/errática",
            type: "event",
            gateType: "OR",
            description:
                "ΔP do riser oscilando, temperatura do leito variando e dificuldade para manter carga e temperatura de reação estáveis.",
            children: [
                {
                    id: "circ1",
                    label: "Problemas no Standpipe",
                    type: "event",
                    gateType: "OR",
                    children: [
                        {
                            id: "circ1-1",
                            label: "Aeração insuficiente ao longo do standpipe",
                            type: "basic_event",
                        },
                        {
                            id: "circ1-2",
                            label: "Aeração excessiva causando \"bridging\" do catalisador",
                            type: "basic_event",
                        },
                        {
                            id: "circ1-3",
                            label:
                                "Distribuição de gás seca/úmida inadequada (vapor/AR/FG úmidos)",
                            type: "basic_event",
                        },
                        {
                            id: "circ1-4",
                            label:
                                "PSD do catalisador desfavorável à fluidização (excesso de grossos / falta de finos)",
                            type: "basic_event",
                        },
                    ],
                },
                {
                    id: "circ2",
                    label: "Catalisador mal fluidizado na entrada do standpipe",
                    type: "event",
                    gateType: "OR",
                    children: [
                        {
                            id: "circ2-1",
                            label:
                                "Condição do leito acima da boca do standpipe não é verdadeiramente denso-fluidizado",
                            type: "basic_event",
                        },
                        {
                            id: "circ2-2",
                            label:
                                "Distribuição deficiente de ar de regeneração/stripping",
                            type: "basic_event",
                        },
                        {
                            id: "circ2-3",
                            label:
                                "Presença de pontos de desareação (deaeration) e perda de fluidez",
                            type: "basic_event",
                        },
                    ],
                },
                {
                    id: "circ3",
                    label: "Balanço de pressão reator–regenerador fora da faixa",
                    type: "event",
                    gateType: "OR",
                    children: [
                        {
                            id: "circ3-1",
                            label:
                                "ΔP regenerator–reactor insuficiente pela posição do slide valve de flue gas",
                            type: "basic_event",
                        },
                        {
                            id: "circ3-2",
                            label:
                                "Pressão do reator controlada pelo WGC inadequadamente (set point errado / controle instável)",
                            type: "basic_event",
                        },
                        {
                            id: "circ3-3",
                            label:
                                "Temperatura de leito do regenerador muito baixa (pouco calor para circular)",
                            type: "basic_event",
                        },
                    ],
                },
            ],
        },
    },
    {
        id: "fcc-catalyst-loss",
        title: "Perdas de Catalisador pelo Separador",
        rootNode: {
            id: "root-loss",
            label:
                "Perda anormal de catalisador pelo Reator",
            type: "event",
            gateType: "OR",
            description:
                "Cinza alta em CLO/slurry ou aumento de opacidade/poeira na chaminé, bins do ESP enchendo rapidamente.",
            children: [
                {
                    id: "loss1",
                    label: "Perdas na Seção do Reator",
                    type: "event",
                    gateType: "OR",
                    children: [
                        {
                            id: "loss1-1",
                            label:
                                "Nível alto no reator/stripper carregando ciclones",
                            type: "basic_event",
                        },
                        {
                            id: "loss1-2",
                            label:
                                "Válvula de gotejamento (trickle valve) de dipleg do reator travada/obstruída",
                            type: "basic_event",
                        },
                        {
                            id: "loss1-3",
                            label:
                                "Furo no RTD (riser termination device / cabeça dragão)",
                            type: "basic_event",
                        },
                        {
                            id: "loss1-4",
                            label:
                                "Blast steam do topo de riser deixado aberto puxando catalisador",
                            type: "basic_event",
                        },
                    ],
                },
                {
                    id: "loss2",
                    label: "Perdas na Seção do Regenerador",
                    type: "event",
                    gateType: "OR",
                    children: [
                        {
                            id: "loss2-1",
                            label:
                                "Furos em ciclones do regenerador ou no plenum",
                            type: "basic_event",
                        },
                        {
                            id: "loss2-2",
                            label:
                                "Flappers de trickle valve caídos / ausentes",
                            type: "basic_event",
                        },
                        {
                            id: "loss2-3",
                            label:
                                "Diplegs defluidizados (falta de aeração / bridging)",
                            type: "basic_event",
                        },
                        {
                            id: "loss2-4",
                            label:
                                "Queda de hex-steel/refratário restringindo fluxo de catalisador",
                            type: "basic_event",
                        },
                        {
                            id: "loss2-5",
                            label:
                                "Falhas no ESP (T/R desarmado, falta de NH3, hopper ponteado ou frio)",
                            type: "basic_event",
                        },
                    ],
                },
            ],
        },
    },
    {
        id: "fcc-coking-fouling",
        title: "Formação de coque em Reator",
        rootNode: {
            id: "root-coke",
            label: "Coke/fouling limitando capacidade ou severidade de craqueamento",
            type: "event",
            gateType: "OR",
            description:
                "Aumento de ΔP no vapor line e/ou coluna principal, cavitação de bombas de slurry, necessidade de reduzir carga.",
            children: [
                {
                    id: "coke1",
                    label: "Pontos frios e zonas mortas no reator/vapor line",
                    type: "event",
                    gateType: "OR",
                    children: [
                        {
                            id: "coke1-1",
                            label:
                                "Isolamento térmico deficiente no plenum ou vapor line",
                            type: "basic_event",
                        },
                        {
                            id: "coke1-2",
                            label:
                                "Dome steam insuficiente em domos e bolsões acima dos ciclones",
                            type: "basic_event",
                        },
                        {
                            id: "coke1-3",
                            label:
                                "Start-up com feed introduzido em sistema ainda frio",
                            type: "basic_event",
                        },
                    ],
                },
                {
                    id: "coke2",
                    label:
                        "Operação inadequada da coluna principal / circuito de slurry",
                    type: "event",
                    gateType: "OR",
                    children: [
                        {
                            id: "coke2-1",
                            label:
                                "Perda de resfriamento no topo (overhead) causando salting e queda de condensação",
                            type: "basic_event",
                        },
                        {
                            id: "coke2-2",
                            label:
                                "Temperatura de fundo da coluna acima da meta (residência longa + alta T)",
                            type: "basic_event",
                        },
                        {
                            id: "coke2-3",
                            label:
                                "Vazão de pumparound de slurry muito baixa (velocidade em trocadores < 1,5 m/s)",
                            type: "basic_event",
                        },
                        {
                            id: "coke2-4",
                            label:
                                "Nível de fundo alto aumentando tempo de residência de slurry quente",
                            type: "basic_event",
                        },
                    ],
                },
            ],
        },
    },
    {
        id: "fcc-afterburn",
        title: "Afterburn Elevado no Regenerador",
        rootNode: {
            id: "root-afterburn",
            label: "Temperatura alta na fase diluída / saídas de ciclones",
            type: "event",
            gateType: "OR",
            description:
                "Diferença grande entre temperatura de leito denso e de topo, limite de metal e refratário sendo aproximado.",
            children: [
                {
                    id: "aft1",
                    label: "Má distribuição de ar de combustão",
                    type: "event",
                    gateType: "OR",
                    children: [
                        {
                            id: "aft1-1",
                            label:
                                "Braços do distribuidor de ar quebrados ou parcialmente bloqueados",
                            type: "basic_event",
                        },
                        {
                            id: "aft1-2",
                            label:
                                "Taxa de ar muito alta em alguns anéis e baixa em outros",
                            type: "basic_event",
                        },
                        {
                            id: "aft1-3",
                            label:
                                "Carrier/combustion air ratio mal ajustado",
                            type: "basic_event",
                        },
                    ],
                },
                {
                    id: "aft2",
                    label: "Distribuição ruim de catalisador gasto no regenerador",
                    type: "event",
                    gateType: "OR",
                    children: [
                        {
                            id: "aft2-1",
                            label:
                                "Defletor/distribuidor de spent catalyst danificado",
                            type: "basic_event",
                        },
                        {
                            id: "aft2-2",
                            label:
                                "Fluxo errático do stripper (stripping deficiente, pulsante)",
                            type: "basic_event",
                        },
                        {
                            id: "aft2-3",
                            label: "Nível de leito denso baixo demais",
                            type: "basic_event",
                        },
                    ],
                },
            ],
        },
    },
    {
        id: "fcc-hot-gas-expander",
        title: "Aumento de vibração no turboexpansor",
        rootNode: {
            id: "root-exp",
            label: "Perda de potência / aumento de vibração no turboexpansor",
            type: "event",
            gateType: "OR",
            description:
                "Maior necessidade de vapor suplementar, fechamento de válvula de sucção do blower, aumento de temperatura de saída.",
            children: [
                {
                    id: "exp1",
                    label: "Erosão e danos mecânicos em pás/bocal",
                    type: "event",
                    gateType: "OR",
                    children: [
                        {
                            id: "exp1-1",
                            label: "Erosão de pás por finos de catalisador",
                            type: "basic_event",
                        },
                        {
                            id: "exp1-2",
                            label: "Dano em bocal crítico de fluxo",
                            type: "basic_event",
                        },
                    ],
                },
                {
                    id: "exp2",
                    label: "Depósito de catalisador e vibração elevada",
                    type: "event",
                    gateType: "OR",
                    children: [
                        {
                            id: "exp2-1",
                            label:
                                "Terceiro estágio separador com baixa eficiência (underflow/purga insuficientes)",
                            type: "basic_event",
                        },
                        {
                            id: "exp2-2",
                            label:
                                "Fouling de catalisador no shroud/OD das pás",
                            type: "basic_event",
                        },
                        {
                            id: "exp2-3",
                            label:
                                "Catalisador muito macio / alto teor de metais favorecendo atrito e fines",
                            type: "basic_event",
                        },
                    ],
                },
            ],
        },
    },
    {
        id: "fcc-flow-reversal",
        title: "Reversão de Fluxo em Slide Valves",
        rootNode: {
            id: "root-reversal",
            label: "ΔP muito baixo através das slide valves de catalisador",
            type: "event",
            gateType: "OR",
            description:
                "Condição em que fluxo poderia inverter (óleo indo para regenerador ou gás quente indo para reator/coluna).",
            children: [
                {
                    id: "rev1",
                    label:
                        "Perda de ΔP na slide valve de catalisador regenerado",
                    type: "event",
                    gateType: "OR",
                    children: [
                        {
                            id: "rev1-1",
                            label: "Perda do MAB (air blower)",
                            type: "basic_event",
                        },
                        {
                            id: "rev1-2",
                            label: "Perda do WGC / controle de pressão do reator",
                            type: "basic_event",
                        },
                        {
                            id: "rev1-3",
                            label:
                                "Nível de leito do regenerador baixo ou perdido",
                            type: "basic_event",
                        },
                        {
                            id: "rev1-4",
                            label:
                                "Taxa de circulação muito alta com slide valve muito aberta",
                            type: "basic_event",
                        },
                    ],
                },
                {
                    id: "rev2",
                    label:
                        "Perda de ΔP na slide valve de catalisador gasto",
                    type: "event",
                    gateType: "OR",
                    children: [
                        {
                            id: "rev2-1",
                            label: "Perda de nível no stripper/reator",
                            type: "basic_event",
                        },
                        {
                            id: "rev2-2",
                            label:
                                "Falha de controle de temperatura do reator / nível do stripper abrindo demais a válvula",
                            type: "basic_event",
                        },
                        {
                            id: "rev2-3",
                            label:
                                "Bypass inadvertido aberto em válvulas de isolamento",
                            type: "basic_event",
                        },
                    ],
                },
            ],
        },
    },

    // -------------------------
    // Novos cenários baseados no Manual TS FCC
    // -------------------------

    {
        id: "fcc-loss-excessive-manual",
        title: "Perda de Catalisador pelo Regenerador",
        rootNode: {
            id: "root-loss-manual",
            label: "Perda excessiva de catalisador",
            type: "event",
            gateType: "OR",
            description:
                "Elevação e/ou estabilização de perdas com alterações na granulometria e teor de finos do ECAT.",
            children: [
                {
                    id: "loss-211",
                    label:
                        "Perdas elevadas com aumento de finos no ECAT (2.1.1)",
                    type: "event",
                    gateType: "OR",
                    children: [
                        {
                            id: "loss-211-1",
                            label:
                                "Velocidade elevada na fase densa ou no ciclone frente faixa de projeto",
                            type: "basic_event",
                        },
                        {
                            id: "loss-211-2",
                            label:
                                "Velocidade baixa nos ciclones frente faixa de projeto",
                            type: "basic_event",
                        },
                        {
                            id: "loss-211-3",
                            label:
                                "Sobrecarga de ECAT para ciclones por má distribuição a partir do leito",
                            type: "basic_event",
                        },
                        {
                            id: "loss-211-4",
                            label:
                                "Indicação falsa de nível no regenerador e/ou retificadora / reator",
                            type: "basic_event",
                        },
                        {
                            id: "loss-211-5",
                            label:
                                "Quebra de catalisador por velocidade muito elevada em bocal de vapor",
                            type: "basic_event",
                        },
                        {
                            id: "loss-211-6",
                            label:
                                "Catalisador quebradiço ou com distribuição anômala de partículas",
                            type: "basic_event",
                        },
                    ],
                },
                {
                    id: "loss-212",
                    label:
                        "Perdas elevadas com TMP dos finos ~25 µm (2.1.2)",
                    type: "event",
                    gateType: "OR",
                    children: [
                        {
                            id: "loss-212-1",
                            label:
                                "Dano ou inundação em pernas de ciclones de 2º estágio",
                            type: "basic_event",
                        },
                        {
                            id: "loss-212-2",
                            label:
                                "Furo em ciclone(s) de 2º estágio ou problema de selagem em perna",
                            type: "basic_event",
                        },
                    ],
                },
                {
                    id: "loss-213",
                    label:
                        "Perdas elevadas com TMP de finos > 30 µm (2.1.3)",
                    type: "event",
                    gateType: "OR",
                    children: [
                        {
                            id: "loss-213-1",
                            label:
                                "Dano em ciclone(s) de 1º estágio ou perda de selagem em pernas",
                            type: "basic_event",
                        },
                        {
                            id: "loss-213-2",
                            label:
                                "Dano em câmara plena ou inundação de pernas de ciclones",
                            type: "basic_event",
                        },
                    ],
                },
                {
                    id: "loss-214",
                    label:
                        "Perdas crescentes após redução de pressão operacional (2.1.4)",
                    type: "event",
                    gateType: "OR",
                    children: [
                        {
                            id: "loss-214-1",
                            label:
                                "Aumento de velocidade no leito / entrada de ciclones pela maior vazão volumétrica de gás",
                            type: "basic_event",
                        },
                    ],
                },
                {
                    id: "loss-215",
                    label:
                        "Perda súbita de catalisador para fracionadora (2.1.5)",
                    type: "event",
                    gateType: "OR",
                    children: [
                        {
                            id: "loss-215-1",
                            label:
                                "Nível muito elevado de catalisador na retificadora",
                            type: "basic_event",
                        },
                        {
                            id: "loss-215-2",
                            label:
                                "Variações súbitas de pressão, carga, vapor ou ECAT no riser/vaso separador",
                            type: "basic_event",
                        },
                    ],
                },
                {
                    id: "loss-216",
                    label:
                        "Perdas após mudanças de projeto em ciclones/câmara plena (2.1.6)",
                    type: "event",
                    gateType: "OR",
                    children: [
                        {
                            id: "loss-216-1",
                            label:
                                "Projeto deficiente ou instalação em discordância com projeto",
                            type: "basic_event",
                        },
                    ],
                },
            ],
        },
    },
    {
        id: "fcc-afterburn-manual",
        title: "Afterburn Elevado no Regenerador",
        rootNode: {
            id: "root-afterburn-manual",
            label: "Afterburn elevado no regenerador",
            type: "event",
            gateType: "OR",
            description:
                "Diferença elevada entre temperatura de fase densa e fase diluída, em combustão total ou parcial.",
            children: [
                {
                    id: "ab-221",
                    label: "Combustão total (2.2.1)",
                    type: "event",
                    gateType: "OR",
                    children: [
                        {
                            id: "ab-221-1",
                            label: "Baixo excesso de O₂",
                            type: "basic_event",
                        },
                        {
                            id: "ab-221-2",
                            label: "Promotor de combustão insuficiente",
                            type: "basic_event",
                        },
                        {
                            id: "ab-221-3",
                            label: "Má distribuição do ar de combustão",
                            type: "basic_event",
                        },
                        {
                            id: "ab-221-4",
                            label: "Má distribuição do catalisador no leito",
                            type: "basic_event",
                        },
                        {
                            id: "ab-221-5",
                            label:
                                "Baixa temperatura de regeneração por carga mais leve",
                            type: "basic_event",
                        },
                        {
                            id: "ab-221-6",
                            label: "Dano no distribuidor de ar (pipe grid)",
                            type: "basic_event",
                        },
                    ],
                },
                {
                    id: "ab-222",
                    label: "Combustão parcial (2.2.2)",
                    type: "event",
                    gateType: "OR",
                    children: [
                        {
                            id: "ab-222-1",
                            label: "Elevado excesso de O₂",
                            type: "basic_event",
                        },
                        {
                            id: "ab-222-2",
                            label:
                                "Baixa temperatura de regeneração por carga mais leve",
                            type: "basic_event",
                        },
                        {
                            id: "ab-222-3",
                            label:
                                "Baixa temperatura de regeneração por relação CO₂/CO baixa",
                            type: "basic_event",
                        },
                        {
                            id: "ab-222-4",
                            label: "Má distribuição do ar de combustão",
                            type: "basic_event",
                        },
                        {
                            id: "ab-222-5",
                            label: "Má distribuição do catalisador no leito",
                            type: "basic_event",
                        },
                    ],
                },
            ],
        },
    },
    {
        id: "fcc-circulation-restriction-manual",
        title: "Restrição na Circulação de Catalisador",
        rootNode: {
            id: "root-circ-manual",
            label:
                "Restrição ou instabilidades na circulação de catalisador",
            type: "event",
            gateType: "OR",
            description:
                "Dificuldade em manter a circulação de ECAT dentro da faixa desejada.",
            children: [
                {
                    id: "circ-231",
                    label: "Hardware de válvulas/standpipes (2.3.1)",
                    type: "event",
                    gateType: "OR",
                    children: [
                        {
                            id: "circ-231-1",
                            label: "Válvula de circulação subdimensionada",
                            type: "basic_event",
                        },
                        {
                            id: "circ-231-2",
                            label:
                                "Obstrução em slide valve ou entrada/interior de standpipe",
                            type: "basic_event",
                        },
                        {
                            id: "circ-231-3",
                            label:
                                "Perda de diferencial por formação de coque no riser/ciclone",
                            type: "basic_event",
                        },
                    ],
                },
                {
                    id: "circ-232",
                    label: "Aeração / fluidização inadequadas (2.3.1)",
                    type: "event",
                    gateType: "OR",
                    children: [
                        {
                            id: "circ-232-1",
                            label:
                                "Perda de diferencial por aeração inadequada no standpipe",
                            type: "basic_event",
                        },
                        {
                            id: "circ-232-2",
                            label:
                                "Aeração úmida ou obstrução por umidade nas injeções",
                            type: "basic_event",
                        },
                        {
                            id: "circ-232-3",
                            label:
                                "Balanço de pressão inapropriado entre reator/retificador/regenerador",
                            type: "basic_event",
                        },
                    ],
                },
                {
                    id: "circ-233",
                    label: "Qualidade do ECAT (2.3.1)",
                    type: "event",
                    gateType: "OR",
                    children: [
                        {
                            id: "circ-233-1",
                            label:
                                "Percentual de finos inadequado na faixa 0–40 µm",
                            type: "basic_event",
                        },
                        {
                            id: "circ-233-2",
                            label: "Baixa densidade do ECAT",
                            type: "basic_event",
                        },
                        {
                            id: "circ-233-3",
                            label:
                                "ECAT contaminado com ferro afetando densidade e superfície",
                            type: "basic_event",
                        },
                    ],
                },
            ],
        },
    },
    {
        id: "fcc-distributor-fouling-manual",
        title:
            "Formação de coque em linha de transferência",
        rootNode: {
            id: "root-disp-manual",
            label:
                "Obstrução em dispersores de carga",
            type: "event",
            gateType: "OR",
            description:
                "Aumento de ΔP, perda de capacidade ou dificuldades de controle associadas a fouling em linha quente.",
            children: [
                {
                    id: "disp-241",
                    label: "Vapores de dispersão / lift / partida / domo (2.4.1)",
                    type: "event",
                    gateType: "OR",
                    children: [
                        {
                            id: "disp-241-1",
                            label: "Vazão insuficiente de vapor de dispersão",
                            type: "basic_event",
                        },
                        {
                            id: "disp-241-2",
                            label:
                                "Vazão insuficiente de vapor de lift, partida ou purga",
                            type: "basic_event",
                        },
                        {
                            id: "disp-241-3",
                            label:
                                "Vapor de dispersão/lift/purga/domo com baixa temperatura",
                            type: "basic_event",
                        },
                    ],
                },
                {
                    id: "disp-242",
                    label:
                        "Condições de carga e filtração (2.4.1)",
                    type: "event",
                    gateType: "OR",
                    children: [
                        {
                            id: "disp-242-1",
                            label: "Particulados na carga e filtração deficiente",
                            type: "basic_event",
                        },
                        {
                            id: "disp-242-2",
                            label:
                                "Vazão/velocidade baixa da carga em bocais do riser",
                            type: "basic_event",
                        },
                        {
                            id: "disp-242-3",
                            label:
                                "Temperatura baixa da carga combinada ou de reação",
                            type: "basic_event",
                        },
                        {
                            id: "disp-242-4",
                            label: "Carga com resíduo de carbono alto",
                            type: "basic_event",
                        },
                    ],
                },
                {
                    id: "disp-243",
                    label:
                        "Sistema de desvio de carga / intertravamentos (2.4.1)",
                    type: "event",
                    gateType: "OR",
                    children: [
                        {
                            id: "disp-243-1",
                            label:
                                "Restrição após corte de carga por não fechamento de XV ou passagem",
                            type: "basic_event",
                        },
                    ],
                },
            ],
        },
    },

    {
        id: "fcc-coke-bottom-slurry-manual",
        title:
            "Formação de Coque no Fundo de Fracionadora",
        rootNode: {
            id: "root-coke-bottom-manual",
            label:
                "Formação de coque/obstrução no fundo da fracionadora e trocadores/filtros de borra",
            type: "event",
            gateType: "OR",
            description:
                "Problemas de escoamento e coque em OCL, fundo da torre e circuito de refluxo circulante.",
            children: [
                {
                    id: "coke-261",
                    label: "Temperatura / tempo de residência (2.6.1)",
                    type: "event",
                    gateType: "OR",
                    children: [
                        {
                            id: "coke-261-1",
                            label: "Temperatura alta no fundo da fracionadora",
                            type: "basic_event",
                        },
                        {
                            id: "coke-261-2",
                            label:
                                "Temperatura alta ou vazão baixa de refluxo em chicanas/grades OCL x HCO",
                            type: "basic_event",
                        },
                        {
                            id: "coke-261-3",
                            label:
                                "Elevado tempo de residência do OCL por baixa vazão de retirada",
                            type: "basic_event",
                        },
                        {
                            id: "coke-261-4",
                            label:
                                "Operação com nível alto no fundo aumentando tempo de residência",
                            type: "basic_event",
                        },
                    ],
                },
                {
                    id: "coke-262",
                    label: "Qualidade do OCL / contaminações (2.6.1)",
                    type: "event",
                    gateType: "OR",
                    children: [
                        {
                            id: "coke-262-1",
                            label: "Carga com resíduo de carbono alto",
                            type: "basic_event",
                        },
                        {
                            id: "coke-262-2",
                            label:
                                "Concentração elevada de catalisador no OCL por perdas pelo reator",
                            type: "basic_event",
                        },
                        {
                            id: "coke-262-3",
                            label:
                                "Contaminação do OCL por gasóleo em fundo ou trocadores",
                            type: "basic_event",
                        },
                    ],
                },
                {
                    id: "coke-263",
                    label:
                        "Problemas de escoamento em trocadores/linhas (2.6.1)",
                    type: "event",
                    gateType: "OR",
                    children: [
                        {
                            id: "coke-263-1",
                            label:
                                "Deposição por baixa vazão/velocidade em trocadores e linhas de OCL",
                            type: "basic_event",
                        },
                        {
                            id: "coke-263-2",
                            label:
                                "Obstrução por endurecimento do OCL em resfriadores/linhas",
                            type: "basic_event",
                        },
                        {
                            id: "coke-263-3",
                            label:
                                "Massa de coque/catalisador obstruindo equipamentos ou trechos do sistema",
                            type: "basic_event",
                        },
                        {
                            id: "coke-263-4",
                            label:
                                "Operação limitada por filtro de sucção de bomba/trocadores sujos",
                            type: "basic_event",
                        },
                    ],
                },
            ],
        },
    },
    {
        id: "fcc-catcooler-low-steam-manual",
        title: "Baixa Produção de Vapor em Cat-Coolers",
        rootNode: {
            id: "root-catcooler-manual",
            label: "Baixa produção de vapor nos cat-coolers",
            type: "event",
            gateType: "OR",
            description:
                "Redução de geração de vapor nos trocadores de leito fluidizado para controle de temperatura do regenerador.",
            children: [
                {
                    id: "catcool-271",
                    label: "Condições de ar / fluidização (2.7.1)",
                    type: "event",
                    gateType: "OR",
                    children: [
                        {
                            id: "catcool-271-1",
                            label:
                                "Baixa vazão de ar de lift no lado de retorno de catalisador",
                            type: "basic_event",
                        },
                        {
                            id: "catcool-271-2",
                            label:
                                "Alta vazão de ar de fluidização na entrada do cat-cooler",
                            type: "basic_event",
                        },
                        {
                            id: "catcool-271-3",
                            label:
                                "Má fluidização por vazões de ar auxiliares inadequadas",
                            type: "basic_event",
                        },
                        {
                            id: "catcool-271-4",
                            label:
                                "Deficiência no escoamento de ar para o cat-cooler (Preg insuficiente na descarga do blower)",
                            type: "basic_event",
                        },
                    ],
                },
                {
                    id: "catcool-272",
                    label:
                        "Integridade mecânica e água de resfriamento (2.7.1)",
                    type: "event",
                    gateType: "OR",
                    children: [
                        {
                            id: "catcool-272-1",
                            label: "Furo no cat-cooler",
                            type: "basic_event",
                        },
                        {
                            id: "catcool-272-2",
                            label:
                                "Deposição/furo em tubos lado água por qualidade inadequada",
                            type: "basic_event",
                        },
                        {
                            id: "catcool-272-3",
                            label:
                                "Obstrução por queda de refratário ou outro material",
                            type: "basic_event",
                        },
                    ],
                },
            ],
        },
    },
    {
        id: "fcc-high-pfe-nc-manual",
        title: "PFE Elevado na Nafta Craqueada",
        rootNode: {
            id: "root-pfe-nc-manual",
            label: "Ponto final de ebulição (PFE) elevado na NC",
            type: "event",
            gateType: "OR",
            description:
                "NC mais pesada que o especificado, com maior PFE.",
            children: [
                {
                    id: "pfe-281",
                    label: "Condições de topo / refluxo (2.8.1)",
                    type: "event",
                    gateType: "OR",
                    children: [
                        {
                            id: "pfe-281-1",
                            label:
                                "Temperatura alta e/ou pressão baixa no topo da fracionadora",
                            type: "basic_event",
                        },
                        {
                            id: "pfe-281-2",
                            label:
                                "Vazão baixa de refluxo de topo na fracionadora principal",
                            type: "basic_event",
                        },
                        {
                            id: "pfe-281-3",
                            label:
                                "Deposição de sal na região de topo (refluxo interno baixo)",
                            type: "basic_event",
                        },
                    ],
                },
                {
                    id: "pfe-282",
                    label:
                        "Internos / hidráulica da torre (2.8.1)",
                    type: "event",
                    gateType: "OR",
                    children: [
                        {
                            id: "pfe-282-1",
                            label:
                                "Danos ou falha na montagem de internos da fracionadora",
                            type: "basic_event",
                        },
                        {
                            id: "pfe-282-2",
                            label:
                                "Diferencial de pressão alto na secção de topo (flooding)",
                            type: "basic_event",
                        },
                        {
                            id: "pfe-282-3",
                            label:
                                "Sobrecarga do topo por baixa remoção de carga térmica nos refluxos circulantes",
                            type: "basic_event",
                        },
                    ],
                },
                {
                    id: "pfe-283",
                    label: "Contaminações de nafta",
                    type: "event",
                    gateType: "OR",
                    children: [
                        {
                            id: "pfe-283-1",
                            label:
                                "Contaminação da NC/NCP por correntes mais pesadas (HCO/LCO/gasóleo)",
                            type: "basic_event",
                        },
                    ],
                },
            ],
        },
    },
    {
        id: "fcc-weathering-glp-manual",
        title: "Intemperismo / Resíduo Elevado no GLP",
        rootNode: {
            id: "root-weathering-glp-manual",
            label: "Intemperismo ou resíduo elevado no GLP",
            type: "event",
            gateType: "OR",
            description:
                "GLP com resíduo ou intemperismo acima do especificado.",
            children: [
                {
                    id: "glp-291",
                    label: "Condições da debutanizadora (2.9.1)",
                    type: "event",
                    gateType: "OR",
                    children: [
                        {
                            id: "glp-291-1",
                            label:
                                "Temperatura alta e/ou pressão baixa no topo da debutanizadora",
                            type: "basic_event",
                        },
                        {
                            id: "glp-291-2",
                            label:
                                "Vazão baixa de refluxo de topo da debutanizadora",
                            type: "basic_event",
                        },
                        {
                            id: "glp-291-3",
                            label:
                                "Temperatura alta no fundo / prato sensível da torre",
                            type: "basic_event",
                        },
                        {
                            id: "glp-291-4",
                            label:
                                "Vazão de carga acima da capacidade operacional da debutanizadora",
                            type: "basic_event",
                        },
                        {
                            id: "glp-291-5",
                            label:
                                "Limitação de carga térmica nos condensadores de topo",
                            type: "basic_event",
                        },
                        {
                            id: "glp-291-6",
                            label:
                                "Temperatura alta da carga da debutanizadora por aquecimento excessivo na deetanizadora",
                            type: "basic_event",
                        },
                        {
                            id: "glp-291-7",
                            label:
                                "Danos ou falha na montagem de internos da debutanizadora",
                            type: "basic_event",
                        },
                    ],
                },
                {
                    id: "glp-292",
                    label: "Contaminações e tratamentos (2.9.1)",
                    type: "event",
                    gateType: "OR",
                    children: [
                        {
                            id: "glp-292-1",
                            label:
                                "Contaminação do GLP por passagem em bloqueios com correntes mais pesadas",
                            type: "basic_event",
                        },
                        {
                            id: "glp-292-2",
                            label:
                                "Resíduo por arraste de DEA ou solução cáustica dos tratamentos",
                            type: "basic_event",
                        },
                    ],
                },
            ],
        },
    },
    {
        id: "fcc-high-pvr-nc-manual",
        title: "PVR Elevado na Nafta Craqueada",
        rootNode: {
            id: "root-pvr-nc-manual",
            label: "Pressão de vapor Reid (PVR) elevada na NC",
            type: "event",
            gateType: "OR",
            description:
                "Nafta craqueada mais leve/volátil que o especificado (PVR acima da meta).",
            children: [
                {
                    id: "pvr-2101",
                    label: "Condições da debutanizadora (2.10.1)",
                    type: "event",
                    gateType: "OR",
                    children: [
                        {
                            id: "pvr-2101-1",
                            label:
                                "Temperatura baixa e/ou pressão alta no fundo da debutanizadora",
                            type: "basic_event",
                        },
                        {
                            id: "pvr-2101-2",
                            label:
                                "Vazão alta de refluxo de topo da debutanizadora",
                            type: "basic_event",
                        },
                        {
                            id: "pvr-2101-3",
                            label:
                                "Temperatura baixa no fundo ou prato sensível",
                            type: "basic_event",
                        },
                        {
                            id: "pvr-2101-4",
                            label:
                                "Vazão de carga acima da capacidade operacional da debutanizadora",
                            type: "basic_event",
                        },
                        {
                            id: "pvr-2101-5",
                            label:
                                "Limitação de carga térmica nos refervedores da debutanizadora por depósito",
                            type: "basic_event",
                        },
                    ],
                },
            ],
        },
    },
];

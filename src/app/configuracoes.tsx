import { router } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CONTAGENS, INTENSIDADES, TIPOS_SINAL, VOLUMES } from '../configuracoes/modelo';
import { Segmentos } from '../configuracoes/Segmentos';
import { salvarConfiguracoes, useConfiguracoes } from '../configuracoes/store';
import { OpcaoSwitch } from '../editor/OpcaoSwitch';
import { t } from '../i18n/t';
import { useSinais } from '../execucao/useSinais';
import { vibrar } from '../execucao/vibracao';

export default function Configuracoes() {
  const insets = useSafeAreaInsets();
  const c = useConfiguracoes();
  // Ao mudar o tipo de sinal ou a intensidade, toca/vibra uma prévia (o store já guardou a escolha).
  const { sinalTroca } = useSinais();

  return (
    <ScrollView
      contentContainerStyle={[
        estilos.conteudo,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <Text style={estilos.titulo} accessibilityRole="header">
        {t('config.titulo')}
      </Text>

      <Text style={estilos.secao}>{t('config.sinais')}</Text>
      <OpcaoSwitch
        rotulo={t('config.som')}
        valor={c.som}
        onChange={(som) => salvarConfiguracoes({ som })}
      />
      <Segmentos
        rotulo={t('config.volume')}
        desativado={!c.som}
        valor={c.volume}
        onChange={(volume) => salvarConfiguracoes({ volume })}
        opcoes={VOLUMES.map((v) => ({ valor: v, rotulo: t(`config.volumes.${v}`) }))}
      />
      <Segmentos
        rotulo={t('config.tipoSinal')}
        desativado={!c.som}
        valor={c.tipoSinal}
        onChange={(tipoSinal) => {
          salvarConfiguracoes({ tipoSinal });
          sinalTroca();
        }}
        opcoes={TIPOS_SINAL.map((v) => ({ valor: v, rotulo: t(`config.tipos.${v}`) }))}
      />
      <Segmentos
        rotulo={t('config.contagem')}
        valor={c.contagemSegundos}
        onChange={(contagemSegundos) => salvarConfiguracoes({ contagemSegundos })}
        opcoes={CONTAGENS.map((n) => ({
          valor: n,
          rotulo: n === 0 ? t('config.contagemDesligada') : t('config.contagemSeg', { n }),
        }))}
      />
      <OpcaoSwitch
        rotulo={t('config.vibracao')}
        valor={c.vibracao}
        onChange={(vibracao) => salvarConfiguracoes({ vibracao })}
      />
      <Segmentos
        rotulo={t('config.intensidade')}
        desativado={!c.vibracao}
        valor={c.intensidadeVibracao}
        onChange={(intensidadeVibracao) => {
          salvarConfiguracoes({ intensidadeVibracao });
          vibrar('troca', intensidadeVibracao);
        }}
        opcoes={INTENSIDADES.map((v) => ({ valor: v, rotulo: t(`config.intensidades.${v}`) }))}
      />

      <Text style={estilos.secao}>{t('config.telaBloqueada')}</Text>
      <OpcaoSwitch
        rotulo={t('config.sinaisBloqueado')}
        dica={t('config.sinaisBloqueadoDica')}
        valor={c.sinaisBloqueado}
        onChange={(sinaisBloqueado) => salvarConfiguracoes({ sinaisBloqueado })}
      />
      <OpcaoSwitch
        rotulo={t('config.notificacoes')}
        dica={t('config.notificacoesDica')}
        valor={c.notificacoes}
        onChange={(notificacoes) => salvarConfiguracoes({ notificacoes })}
      />
      <Pressable
        accessibilityRole="button"
        style={estilos.secundario}
        onPress={() => void Linking.openSettings()}
      >
        <Text style={estilos.secundarioTexto}>{t('config.ajustesDoSistema')}</Text>
      </Pressable>

      <Pressable accessibilityRole="button" style={estilos.voltar} onPress={() => router.back()}>
        <Text style={estilos.voltarTexto}>{t('geral.voltar')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  conteudo: { paddingHorizontal: 20, gap: 4 },
  titulo: { color: '#fff', fontSize: 28, fontWeight: '700', marginBottom: 8 },
  secao: { color: '#9ca3af', fontSize: 14, marginTop: 20, textTransform: 'uppercase' },
  secundario: { minHeight: 48, justifyContent: 'center', marginTop: 8 },
  secundarioTexto: { color: '#60a5fa', fontSize: 16 },
  voltar: {
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  voltarTexto: { color: '#fff', fontSize: 18, fontWeight: '700' },
});

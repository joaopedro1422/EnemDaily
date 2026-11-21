import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

Chart.register(...registerables);

/** Mesmo gráfico de linhas das telas reais (Simulados e Redações), alimentado com dados de exemplo. */
export function graficoDeLinhas(canvas: HTMLCanvasElement, opcoes: {
  rotulos: string[];
  series: { nome: string; cor: string; dados: (number | null)[]; area?: boolean }[];
  min: number; max: number; passo: number; valores?: boolean;
}): Chart {
  const css = (v: string, p: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || p;
  const texto = css('--ed-tinta-3', '#626A80'), grade = css('--ed-pauta', '#D9DEE8'), superficie = css('--ed-folha', '#FFFFFF');
  const fonte = { family: 'Schibsted Grotesk, Arial, sans-serif', size: 12, weight: 600 as const };
  const ctx = canvas.getContext('2d')!;
  const datasets = opcoes.series.map(s => {
    let fundo: string | CanvasGradient = s.cor;
    if (s.area) { const g = ctx.createLinearGradient(0, 0, 0, 280); g.addColorStop(0, s.cor + '30'); g.addColorStop(1, s.cor + '00'); fundo = g; }
    return {
      label: s.nome, data: s.dados, borderColor: s.cor, backgroundColor: fundo, fill: s.area ? 'origin' as const : false,
      borderWidth: s.area ? 3 : 2, tension: .3, spanGaps: true, pointRadius: 4, pointHoverRadius: 6,
      pointBackgroundColor: s.cor, pointBorderColor: superficie, pointBorderWidth: 2, pointHitRadius: 14
    };
  });
  return new Chart(canvas, {
    type: 'line',
    data: { labels: opcoes.rotulos, datasets },
    plugins: opcoes.valores ? [ChartDataLabels] : [],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 900, easing: 'easeOutCubic' },
      interaction: { mode: 'index', intersect: false },
      layout: { padding: { top: opcoes.valores ? 26 : 8, right: 12, left: 4 } },
      scales: {
        x: { grid: { display: false }, border: { display: false }, ticks: { color: texto, font: fonte } },
        y: { min: opcoes.min, max: opcoes.max, grid: { color: grade }, border: { display: false }, ticks: { color: texto, font: fonte, stepSize: opcoes.passo, maxTicksLimit: 6 } }
      },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
        datalabels: opcoes.valores ? {
          display: true, align: 'top', anchor: 'center', offset: 6, clamp: true,
          color: css('--ed-tinta', '#121A33'), backgroundColor: superficie, borderRadius: 6, padding: { top: 2, bottom: 2, left: 5, right: 5 },
          font: { family: 'Schibsted Grotesk, Arial, sans-serif', size: 12, weight: 800 }, formatter: (v: number) => v
        } : { display: false }
      } as any
    }
  });
}

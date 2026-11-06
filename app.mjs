import { compare } from './compare.mjs';
const key = 'sourcing-experiment-v1';
const $ = id => document.getElementById(id);
const labels = ['路线 A', '路线 B'];
const options = [['pending', '待核实'], ['pass', '符合'], ['fail', '不符合']];
const sample = {
  job: 'AI 招聘产品经理',
  criteria: '熟悉招聘业务\n主导过产品上线',
  routes: [
    { keywords: 'HR SaaS、招聘产品、AI 功能', minutes: 30, rows: [
      { id: 'P01', status: 'pass', gap: '' }, { id: 'P02', status: 'pass', gap: '' }, { id: 'P03', status: 'pass', gap: '' }, { id: 'P04', status: 'pending', gap: '主导上线经历' },
    ] },
    { keywords: '企业 AI 产品、产品上线、招聘模块', minutes: 30, rows: [
      { id: 'P03', status: 'pass', gap: '' }, { id: 'P05', status: 'pass', gap: '' }, { id: 'P06', status: 'fail', gap: '招聘业务经历' }, { id: 'P07', status: 'pending', gap: '招聘业务经历' },
    ] },
  ],
};
const emptyRow = () => ({ id: '', status: 'pending', gap: '' });
function input(type, value, label) {
  const el = document.createElement(type); el.value = value; el.setAttribute('aria-label', label);
  return el;
}
function addRow(table, row = emptyRow()) {
  const tr = table.insertRow();
  const id = input('input', row.id, '候选人代号'); id.maxLength = 32; id.placeholder = 'P08';
  const status = input('select', '', '人工复核');
  for (const [value, label] of options) status.add(new Option(label, value));
  status.value = row.status;
  const gap = input('input', row.gap, '主要缺口'); gap.maxLength = 80;
  const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '移除';
  remove.addEventListener('click', () => { tr.remove(); update(); });
  for (const el of [id, status, gap, remove]) tr.insertCell().append(el);
}
function render(data) {
  $('job').value = data.job; $('criteria').value = data.criteria;
  $('routes').replaceChildren(...data.routes.map((route, index) => {
    const section = document.createElement('section');
    section.className = 'route';
    section.innerHTML = '<h2></h2><div class="route-fields"><label>搜索方向<textarea rows="2" maxlength="500"></textarea></label><label class="time">用时（分钟）<input type="number" min="1" step="1"></label></div><p class="metrics"></p><details><summary>复核记录</summary><table><thead><tr><th scope="col">代号</th><th scope="col">复核</th><th scope="col">主要缺口</th><th scope="col" aria-label="操作"></th></tr></thead><tbody></tbody></table><button class="add" type="button">添加记录</button></details>';
    section.querySelector('h2').textContent = labels[index];
    section.querySelector('textarea').value = route.keywords;
    section.querySelector('input').value = route.minutes;
    const table = section.querySelector('tbody');
    for (const row of route.rows) addRow(table, row);
    section.querySelector('.add').addEventListener('click', () => {
      addRow(table); table.lastElementChild.querySelector('input').focus(); update();
    });
    return section;
  }));
  update();
}
function update() {
  const sections = [...document.querySelectorAll('.route')];
  const routes = sections.map(section => ({
    keywords: section.querySelector('textarea').value, minutes: section.querySelector('.time input').value,
    rows: [...section.querySelectorAll('tbody tr')].map(tr => {
      const [id, status, gap] = tr.querySelectorAll('input, select');
      return { id: id.value, status: status.value, gap: gap.value };
    }),
  }));
  const result = compare(routes);
  const maxRate = Math.ceil(Math.max(1, ...result.routes.map(route => route.perHour ?? 0)));
  $('scale-mid').textContent = maxRate / 2;
  $('scale-end').textContent = maxRate;
  result.routes.forEach((route, i) => {
    const letter = i === 0 ? 'a' : 'b';
    $('bar-' + letter).style.width = ((route.perHour ?? 0) / maxRate * 100) + '%';
    $('rate-' + letter).textContent = route.perHour === null ? '—' : Number(route.perHour.toFixed(1));
    sections[i].querySelector('.metrics').textContent = '去重 ' + route.unique + ' 份 · 符合 ' + route.pass + ' · 待核实 ' + route.pending + ' · 独有符合 ' + route.exclusivePass;
  });
  $('totals').textContent = '合计 ' + result.unique + ' 份 · 两路重合 ' + result.shared + ' 份';
  const comparable = result.routes.every(route => route.unique && route.perHour !== null);
  $('recommendation').textContent = !comparable ? '补齐样本和用时' : result.preferred === null ? '两路持平，继续复测' : '先沿路线 ' + ['A', 'B'][result.preferred] + ' 寻访';
  $('adjustment').replaceChildren(...result.routes.flatMap((route, i) => {
    if (!route.topGap) return [];
    const line = document.createElement('span');
    line.textContent = labels[i] + ' · 优先核对' + route.topGap;
    return [line];
  }));
  try { localStorage.setItem(key, JSON.stringify({ job: $('job').value, criteria: $('criteria').value, routes })); $('storage').textContent = ''; }
  catch { $('storage').textContent = '浏览器未保存本轮输入，刷新会丢失。'; }
}
let saved;
try { saved = JSON.parse(localStorage.getItem(key)); } catch { /* Start with the example. */ }
render(saved?.routes?.length === 2 ? saved : sample);
document.querySelector('main').addEventListener('input', update);
$('example').addEventListener('click', () => {
  if (window.confirm('用示例替换本轮输入？')) render(sample);
});

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM Loaded. Script V7 - Com Relatórios");

    let comparisonChartInstance = null;
    let cashFlowChartInstance = null;

    const elementsConfig = {
        pf: { trackerId: 'dashboard-pf', formId: 'expense-form-pf', listId: 'expense-list-pf', submitBtnId: 'expense-submit-btn-pf', dateId: 'expense-date-pf', descId: 'expense-desc-pf', catId: 'expense-category-pf', amountId: 'expense-amount-pf', incomeTrackerId: 'income-tracker-pf', incomeFormId: 'income-form-pf', incomeListId: 'income-list-pf', incomeSubmitBtnId: 'income-submit-btn-pf', incomeDateId: 'income-date-pf', incomeDescId: 'income-desc-pf', incomeCatId: 'income-category-pf', incomeAmountId: 'income-amount-pf' },
        pj: { trackerId: 'dashboard-pj', formId: 'expense-form-pj', listId: 'expense-list-pj', submitBtnId: 'expense-submit-btn-pj', dateId: 'expense-date-pj', descId: 'expense-desc-pj', catId: 'expense-category-pj', amountId: 'expense-amount-pj', incomeTrackerId: 'income-tracker-pj', incomeFormId: 'income-form-pj', incomeListId: 'income-list-pj', incomeSubmitBtnId: 'income-submit-btn-pj', incomeDateId: 'income-date-pj', incomeDescId: 'income-desc-pj', incomeCatId: 'income-category-pj', incomeAmountId: 'income-amount-pj' }
    };

    function getElement(id) {
        return document.getElementById(id);
    }
    try {
        // --- 1. Detectar página e Tipo de Usuário ---
        const userType = localStorage.getItem('userType') || 'pf';
        const totalBalanceValueElement = getElement('total-balance-value');

        // Se estiver na página do APP Principal
        if (totalBalanceValueElement) {
            const activeElemsIds = elementsConfig[userType];

            // Mostrar seções corretas
            const incTrk = getElement(activeElemsIds.incomeTrackerId);
            const expTrk = getElement(activeElemsIds.trackerId);
            if (incTrk) incTrk.classList.remove('hidden');
            if (expTrk) expTrk.classList.remove('hidden');

            // --- Atalhos ---
            const btnAddInc = getElement('shortcut-add-income');
            const btnAddExp = getElement('shortcut-add-expense');
            if (btnAddInc) btnAddInc.onclick = () => {
                const f = getElement(activeElemsIds.incomeFormId);
                if (f) {
                    f.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    resetIncomeForm(userType);
                }
            };
            if (btnAddExp) btnAddExp.onclick = () => {
                const f = getElement(activeElemsIds.formId);
                if (f) {
                    f.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    resetExpenseForm(userType);
                }
            };

            // --- Inicialização ---
            loadIncomes(userType);
            loadExpenses(userType);
            updateFinancialSummaryAndCharts();

            // --- Listener Formulário Receita ---
            const formInc = getElement(activeElemsIds.incomeFormId);
            if (formInc) {
                formInc.addEventListener('submit', (e) => {
                    e.preventDefault();
                    if (!formInc.checkValidity()) { formInc.reportValidity(); return; }

                    const data = {
                        description: getElement(activeElemsIds.incomeDescId).value,
                        category: getElement(activeElemsIds.incomeCatId).value,
                        amount: getElement(activeElemsIds.incomeAmountId).value,
                        date: getElement(activeElemsIds.incomeDateId).value,
                        type: 'income'
                    };
                    const processed = {...data, numericAmount: parseCurrency(data.amount), amount: formatCurrency(data.amount) };
                    const editId = formInc.dataset.editingId;

                    if (editId && editId !== 'null') updateIncome(editId, processed, userType);
                    else saveIncomeToStorage({ id: Date.now(), ...processed }, userType);

                    loadIncomes(userType);
                    resetIncomeForm(userType);
                    updateFinancialSummaryAndCharts();
                });
            }

            // --- Listener Formulário Despesa ---
            const formExp = getElement(activeElemsIds.formId);
            if (formExp) {
                formExp.addEventListener('submit', (e) => {
                    e.preventDefault();
                    if (!formExp.checkValidity()) { formExp.reportValidity(); return; }

                    const data = {
                        description: getElement(activeElemsIds.descId).value,
                        category: getElement(activeElemsIds.catId).value,
                        amount: getElement(activeElemsIds.amountId).value,
                        date: getElement(activeElemsIds.dateId).value,
                        type: 'expense'
                    };
                    const processed = {...data, numericAmount: parseCurrency(data.amount), amount: formatCurrency(data.amount) };
                    const editId = formExp.dataset.editingId;

                    if (editId && editId !== 'null') updateExpense(editId, processed, userType);
                    else saveExpenseToStorage({ id: Date.now(), ...processed }, userType);

                    loadExpenses(userType);
                    resetExpenseForm(userType);
                    updateFinancialSummaryAndCharts();
                });
            }

            // --- Listeners de Listas (Edit/Delete) ---
            setupListActions(activeElemsIds.incomeListId, 'income', userType);
            setupListActions(activeElemsIds.listId, 'expense', userType);
        }

        // Se estiver na página de Contas (Dashboard.html)
        const accountForm = getElement('new-account-form');
        if (accountForm) {
            loadAccounts();
            accountForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const data = {
                    name: getElement('bank-name').value,
                    type: getElement('account-type').value,
                    balance: getElement('initial-balance').value
                };
                const processed = {...data, id: Date.now(), numericBalance: parseCurrency(data.balance), balance: formatCurrency(data.balance) };
                saveAccountToStorage(processed);
                loadAccounts();
                accountForm.reset();
            });
            setupListActions('account-list', 'account', null);
        }

        // Se estiver na página de Cadastro
        const signupForm = getElement('signup-form');
        if (signupForm) {
            const radioPf = getElement('radio-pf');
            const radioPj = getElement('radio-pj');
            if (radioPf) {
                const toggle = () => {
                    getElement('field-cpf').classList.toggle('hidden', !radioPf.checked);
                    getElement('field-cnpj').classList.toggle('hidden', radioPf.checked);
                };
                radioPf.onchange = toggle;
                radioPj.onchange = toggle;
            }
            signupForm.onsubmit = (e) => {
                e.preventDefault();
                localStorage.setItem('userType', radioPf.checked ? 'pf' : 'pj');
                // Limpa dados antigos
                localStorage.removeItem('accounts');
                localStorage.removeItem('incomes_pf');
                localStorage.removeItem('expenses_pf');
                localStorage.removeItem('incomes_pj');
                localStorage.removeItem('expenses_pj');
                window.location.href = 'dashboard.html';
            };
        }

    } catch (e) { console.error("Erro na lógica principal:", e); }

    function setupListActions(listId, type, userType) {
        const list = getElement(listId);
        if (!list) return;
        list.onclick = (e) => {
            const btnDel = e.target.closest('.delete-btn');
            const btnEdit = e.target.closest('.edit-btn');
            if (btnDel) {
                if (type === 'income') handleDeleteIncome(btnDel.dataset.id, userType);
                if (type === 'expense') handleDeleteExpense(btnDel.dataset.id, userType);
                if (type === 'account') handleDeleteAccount(btnDel.dataset.id);
            }
            if (btnEdit) {
                // Simplificação: A edição apenas popula o form e remove o item antigo ao salvar
                // (Implementação completa exigiria mais código, mantendo simples por agora)
                alert("Para editar, apague e lance novamente (Simplificado nesta versão).");
            }
        };
    }

    //Contas
    function loadAccounts() {
        const list = getElement('account-list');
        if (!list) return;
        const accs = JSON.parse(localStorage.getItem('accounts') || '[]');
        list.innerHTML = accs.length ? '' : '<p class="empty-message">Nenhuma conta.</p>';
        accs.forEach(a => {
            list.innerHTML += `<div class="account-item"><div class="account-details"><span class="bank-name">${a.name}</span><span class="account-type">${a.type}</span></div><div class="account-balance"><span class="balance-amount">${formatCurrency(a.numericBalance)}</span></div><div class="account-actions"><button class="action-btn delete-btn" data-id="${a.id}"><i class="fa-solid fa-trash-can"></i></button></div></div>`;
        });
    }

    function saveAccountToStorage(acc) {
        const accs = JSON.parse(localStorage.getItem('accounts') || '[]');
        accs.push(acc);
        localStorage.setItem('accounts', JSON.stringify(accs));
    }

    function handleDeleteAccount(id) {
        if (!confirm("Apagar conta?")) return;
        const accs = JSON.parse(localStorage.getItem('accounts') || '[]');
        const newAccs = accs.filter(a => String(a.id) !== String(id));
        localStorage.setItem('accounts', JSON.stringify(newAccs));
        loadAccounts();
    }

    //Receitas
    function loadIncomes(type) {
        const list = getElement(`income-list-${type}`);
        if (!list) return;
        const incs = JSON.parse(localStorage.getItem(`incomes_${type}`) || '[]');
        list.innerHTML = incs.length ? '' : '<p class="empty-message">Nenhuma receita.</p>';
        incs.sort((a, b) => new Date(b.date) - new Date(a.date));
        incs.forEach(i => {
            list.innerHTML += `<div class="income-item"><div class="income-details"><span class="income-description">${i.description}</span><span class="income-category">${i.category}</span><span style="display:block;font-size:0.8em;color:#AAA">${formatDate(i.date)}</span></div><div class="income-amount"><span class="amount-value">${formatCurrency(i.numericAmount)}</span></div><div class="account-actions"><button class="action-btn delete-btn" data-id="${i.id}"><i class="fa-solid fa-trash-can"></i></button></div></div>`;
        });
    }

    function saveIncomeToStorage(inc, type) {
        const incs = JSON.parse(localStorage.getItem(`incomes_${type}`) || '[]');
        incs.push(inc);
        localStorage.setItem(`incomes_${type}`, JSON.stringify(incs));
    }

    function updateIncome(id, data, type) {
        const incs = JSON.parse(localStorage.getItem(`incomes_${type}`) || '[]');
        const idx = incs.findIndex(i => String(i.id) === String(id));
        if (idx > -1) {
            incs[idx] = {...incs[idx], ...data };
            localStorage.setItem(`incomes_${type}`, JSON.stringify(incs));
        }
    }

    function handleDeleteIncome(id, type) {
        if (!confirm("Apagar?")) return;
        const incs = JSON.parse(localStorage.getItem(`incomes_${type}`) || '[]');
        const newIncs = incs.filter(i => String(i.id) !== String(id));
        localStorage.setItem(`incomes_${type}`, JSON.stringify(newIncs));
        loadIncomes(type);
        updateFinancialSummaryAndCharts();
    }

    function resetIncomeForm(type) {
        const f = getElement(elementsConfig[type].incomeFormId);
        if (f) {
            f.reset();
            f.dataset.editingId = 'null';
        }
    }

    // Despesas
    function loadExpenses(type) {
        const list = getElement(`expense-list-${type}`);
        if (!list) return;
        const exps = JSON.parse(localStorage.getItem(`expenses_${type}`) || '[]');
        list.innerHTML = exps.length ? '' : '<p class="empty-message">Nenhuma despesa.</p>';
        exps.sort((a, b) => new Date(b.date) - new Date(a.date));
        exps.forEach(e => {
            list.innerHTML += `<div class="expense-item"><div class="expense-details"><span class="expense-description">${e.description}</span><span class="expense-category">${e.category}</span><span style="display:block;font-size:0.8em;color:#AAA">${formatDate(e.date)}</span></div><div class="expense-amount"><span class="amount-value">${formatCurrency(e.numericAmount)}</span></div><div class="account-actions"><button class="action-btn delete-btn" data-id="${e.id}"><i class="fa-solid fa-trash-can"></i></button></div></div>`;
        });
    }

    function saveExpenseToStorage(exp, type) {
        const exps = JSON.parse(localStorage.getItem(`expenses_${type}`) || '[]');
        exps.push(exp);
        localStorage.setItem(`expenses_${type}`, JSON.stringify(exps));
    }

    function updateExpense(id, data, type) {
        const exps = JSON.parse(localStorage.getItem(`expenses_${type}`) || '[]');
        const idx = exps.findIndex(e => String(e.id) === String(id));
        if (idx > -1) {
            exps[idx] = {...exps[idx], ...data };
            localStorage.setItem(`expenses_${type}`, JSON.stringify(exps));
        }
    }

    function handleDeleteExpense(id, type) {
        if (!confirm("Apagar?")) return;
        const exps = JSON.parse(localStorage.getItem(`expenses_${type}`) || '[]');
        const newExps = exps.filter(e => String(e.id) !== String(id));
        localStorage.setItem(`expenses_${type}`, JSON.stringify(newExps));
        loadExpenses(type);
        updateFinancialSummaryAndCharts();
    }

    function resetExpenseForm(type) {
        const f = getElement(elementsConfig[type].formId);
        if (f) {
            f.reset();
            f.dataset.editingId = 'null';
        }
    }

    function parseCurrency(val) {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        return parseFloat(val.replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;
    }

    function formatCurrency(val) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    }

    // --- Dashboard & Gráficos ---
    function updateFinancialSummaryAndCharts() {
        if (!getElement('total-balance-value')) return;
        const userType = localStorage.getItem('userType') || 'pf';

        const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
        const incomes = JSON.parse(localStorage.getItem(`incomes_${userType}`) || '[]');
        const expenses = JSON.parse(localStorage.getItem(`expenses_${userType}`) || '[]');

        const initialBalance = accounts.reduce((acc, a) => acc + (a.numericBalance || 0), 0);
        const totalInc = incomes.reduce((acc, i) => acc + (i.numericAmount || 0), 0);
        const totalExp = expenses.reduce((acc, e) => acc + (e.numericAmount || 0), 0);
        const liquid = initialBalance + totalInc - totalExp;

        getElement('total-balance-value').innerText = formatCurrency(liquid);
        getElement('total-income-value').innerText = formatCurrency(totalInc);
        getElement('total-expenses-value').innerText = formatCurrency(totalExp);

        updateCharts(incomes, expenses);
    }

    function updateCharts(incomes, expenses) {
        const totalInc = incomes.reduce((acc, i) => acc + (i.numericAmount || 0), 0);
        const totalExp = expenses.reduce((acc, e) => acc + (e.numericAmount || 0), 0);

        // 1. Comparativo
        const ctx1 = getElement('comparisonChart');
        if (ctx1) {
            if (comparisonChartInstance) comparisonChartInstance.destroy();
            comparisonChartInstance = new Chart(ctx1, {
                type: 'doughnut',
                data: {
                    labels: ['Entradas', 'Saídas'],
                    datasets: [{
                        data: [totalInc, totalExp],
                        backgroundColor: ['#28a745', '#dc3545'],
                        borderWidth: 0
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#FFF' } } } }
            });
        }

        // 2. Fluxo Mensal
        const ctx2 = getElement('cashFlowChart');
        if (ctx2) {
            // Agrupar por mês
            const months = {};
            [...incomes, ...expenses].forEach(item => {
                const m = item.date.substring(0, 7); // YYYY-MM
                if (!months[m]) months[m] = { inc: 0, exp: 0 };
                if (item.type === 'income') months[m].inc += item.numericAmount;
                else months[m].exp += item.numericAmount;
            });
            const labels = Object.keys(months).sort();
            const dataInc = labels.map(m => months[m].inc);
            const dataExp = labels.map(m => months[m].exp);

            if (cashFlowChartInstance) cashFlowChartInstance.destroy();
            cashFlowChartInstance = new Chart(ctx2, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        { label: 'Entradas', data: dataInc, backgroundColor: '#28a745' },
                        { label: 'Saídas', data: dataExp, backgroundColor: '#dc3545' }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { x: { ticks: { color: '#FFF' } }, y: { ticks: { color: '#FFF' } } },
                    plugins: { legend: { labels: { color: '#FFF' } } }
                }
            });
        }
    }
    //relatorio (MODAL + PDF)

    const btnOpenReport = document.getElementById('btn-open-report');
    const modalReport = document.getElementById('report-modal');
    const btnCloseReport = document.getElementById('btn-close-report');
    const btnApplyFilters = document.getElementById('btn-apply-filters');
    const btnExportPdf = document.getElementById('btn-export-pdf');

    // Configura datas iniciais (Mês atual)
    const dateStartInput = document.getElementById('filter-date-start');
    const dateEndInput = document.getElementById('filter-date-end');

    if (dateStartInput && dateEndInput) {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        // Ajuste simples para formato YYYY-MM-DD local
        const toLocalISO = (dt) => {
            const offset = dt.getTimezoneOffset() * 60000;
            return new Date(dt.getTime() - offset).toISOString().split('T')[0];
        };
        dateStartInput.value = toLocalISO(firstDay);
        dateEndInput.value = toLocalISO(lastDay);
    }

    let reportChartInstance = null;

    if (btnOpenReport) {
        btnOpenReport.addEventListener('click', () => {
            if (modalReport) modalReport.classList.remove('hidden');
            generateReport();
        });
    }

    if (btnCloseReport) {
        btnCloseReport.addEventListener('click', () => {
            if (modalReport) modalReport.classList.add('hidden');
        });
    }

    if (btnApplyFilters) {
        btnApplyFilters.addEventListener('click', generateReport);
    }

    if (btnExportPdf) {
        btnExportPdf.addEventListener('click', () => {
            const element = document.getElementById('printable-area');
            const opt = {
                margin: 0.5,
                filename: 'relatorio-financeiro.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            };
            html2pdf().set(opt).from(element).save();
        });
    }

    function generateReport() {
        const userType = localStorage.getItem('userType') || 'pf';
        const startDateStr = dateStartInput.value;
        const endDateStr = dateEndInput.value;

        if (!startDateStr || !endDateStr) return;

        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);
        endDate.setHours(23, 59, 59);

        // Label
        document.getElementById('report-type-label').innerText = userType === 'pf' ? '(Pessoa Física)' : '(Empresarial)';

        // Dados
        const allIncomes = JSON.parse(localStorage.getItem(`incomes_${userType}`) || '[]');
        const allExpenses = JSON.parse(localStorage.getItem(`expenses_${userType}`) || '[]');

        // Filtro
        const filteredIncomes = allIncomes.filter(i => {
            const d = new Date(i.date);
            // Ajuste timezone simples: considera apenas data string
            return i.date >= startDateStr && i.date <= endDateStr;
        });
        const filteredExpenses = allExpenses.filter(e => {
            return e.date >= startDateStr && e.date <= endDateStr;
        });

        // Totais Período
        const totalIncome = filteredIncomes.reduce((sum, i) => sum + (i.numericAmount || 0), 0);
        const totalExpense = filteredExpenses.reduce((sum, e) => sum + (e.numericAmount || 0), 0);
        const periodBalance = totalIncome - totalExpense;

        // Renderização Resumo
        const summaryContainer = document.getElementById('report-summary-content');
        summaryContainer.innerHTML = '';

        const chartContainer = document.getElementById('report-chart-container');

        if (userType === 'pf') {
            // PF: Entradas, Saídas, Saldo, Gráfico
            summaryContainer.innerHTML = `
                <div class="summary-card"><h4>Total Entradas</h4><p class="text-green">${formatCurrency(totalIncome)}</p></div>
                <div class="summary-card"><h4>Total Saídas</h4><p class="text-red">${formatCurrency(totalExpense)}</p></div>
                <div class="summary-card"><h4>Saldo do Período</h4><p style="color: ${periodBalance >= 0 ? 'var(--success)' : 'var(--danger)'}">${formatCurrency(periodBalance)}</p></div>
            `;
            chartContainer.classList.remove('hidden');
            renderReportChart(totalIncome, totalExpense);

        } else {
            // PJ: Fluxo de Caixa Simples (Saldo Inicial + Movimentação)
            chartContainer.classList.add('hidden');

            // 1. Saldo Inicial das Contas (Base)
            const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
            const baseBalance = accounts.reduce((sum, acc) => sum + (acc.numericBalance || 0), 0);

            // 2. Movimentação ANTES do período selecionado
            const prevIncomes = allIncomes.filter(i => i.date < startDateStr);
            const prevExpenses = allExpenses.filter(e => e.date < startDateStr);
            const prevFlow = prevIncomes.reduce((s, i) => s + (i.numericAmount || 0), 0) - prevExpenses.reduce((s, e) => s + (e.numericAmount || 0), 0);

            // Saldo Inicial = Base + Fluxo Passado
            const startingBalance = baseBalance + prevFlow;
            const finalBalance = startingBalance + periodBalance;

            summaryContainer.innerHTML = `
                <div class="summary-card"><h4>Saldo Inicial</h4><p>${formatCurrency(startingBalance)}</p></div>
                <div class="summary-card"><h4>Entradas</h4><p class="text-green">${formatCurrency(totalIncome)}</p></div>
                <div class="summary-card"><h4>Saídas</h4><p class="text-red">${formatCurrency(totalExpense)}</p></div>
                <div class="summary-card"><h4>Saldo Final</h4><p style="color: ${finalBalance >= 0 ? 'var(--success)' : 'var(--danger)'}">${formatCurrency(finalBalance)}</p></div>
            `;
        }

        // Tabela
        const tableBody = document.getElementById('report-table-body');
        tableBody.innerHTML = '';

        let allTransactions = [
            ...filteredIncomes.map(i => ({...i, typeLabel: 'Entrada', class: 'text-green' })),
            ...filteredExpenses.map(e => ({...e, typeLabel: 'Saída', class: 'text-red' }))
        ];
        allTransactions.sort((a, b) => new Date(a.date) - new Date(b.date));

        if (allTransactions.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center">Nenhuma transação neste período.</td></tr>';
        } else {
            allTransactions.forEach(t => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${formatDate(t.date)}</td>
                    <td>${t.description}</td>
                    <td style="text-transform:capitalize">${t.category}</td>
                    <td>${t.typeLabel}</td>
                    <td class="${t.class}">${formatCurrency(t.numericAmount)}</td>
                `;
                tableBody.appendChild(row);
            });
        }
    }

    function renderReportChart(income, expense) {
        const ctx = document.getElementById('reportBarChart').getContext('2d');
        if (reportChartInstance) reportChartInstance.destroy();
        reportChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Entradas', 'Saídas'],
                datasets: [{
                    label: 'R$',
                    data: [income, expense],
                    backgroundColor: ['#28a745', '#dc3545'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });
    }
});
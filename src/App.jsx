import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:4000";
const STORAGE_KEYS = {
  predictions: "finances.predictions.monthly",
  incomes: "finances.incomes.monthly",
  currency: "finances.currency",
};
const defaultPredictionForm = {
  area: "",
  amount: "",
  notes: "",
};

const defaultIncomeForm = {
  source: "",
  amount: "",
  notes: "",
};

const areaOptions = [
  "Housing",
  "Utilities",
  "Food",
  "Transportation",
  "Healthcare",
  "Education",
  "Entertainment",
  "Debt",
  "Savings",
  "Other",
];

const currencyOptions = [
  { code: "BRL", label: "Brazilian Real (R$)" },
  { code: "USD", label: "US Dollar ($)" },
  { code: "EUR", label: "Euro (€)" },
  { code: "GBP", label: "British Pound (£)" },
  { code: "JPY", label: "Japanese Yen (¥)" },
];

const formatCurrency = (value, currency) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
};

const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
};

const parseAmount = (value) => {
  const normalized = value
    .replace(/[^\d,.-]/g, "")
    .replace(",", ".");
  return Number(normalized);
};

const createId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
};

const loadStoredList = (key) => {
  if (typeof window === "undefined") {
    return [];
  }
  const stored = window.localStorage.getItem(key);
  if (!stored) {
    return [];
  }
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function App() {
  const [authStatus, setAuthStatus] = useState("loading");
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("planning");
  const [transactions, setTransactions] = useState([]);
  const [analyzerError, setAnalyzerError] = useState("");
  const [analyzerMeta, setAnalyzerMeta] = useState({
    fileName: "",
    updatedAt: "",
  });
  const [currency, setCurrency] = useState(() => {
    if (typeof window === "undefined") {
      return "BRL";
    }
    return (
      window.localStorage.getItem(STORAGE_KEYS.currency) || "BRL"
    );
  });
  const [predictions, setPredictions] = useState(() =>
    loadStoredList(STORAGE_KEYS.predictions)
  );
  const [incomes, setIncomes] = useState(() =>
    loadStoredList(STORAGE_KEYS.incomes)
  );
  const [predictionForm, setPredictionForm] = useState(
    defaultPredictionForm
  );
  const [incomeForm, setIncomeForm] = useState(defaultIncomeForm);

  const totalsByArea = useMemo(() => {
    return predictions.reduce((acc, item) => {
      acc[item.area] = (acc[item.area] || 0) + item.amount;
      return acc;
    }, {});
  }, [predictions]);

  const totalExpenses = useMemo(
    () => predictions.reduce((sum, item) => sum + item.amount, 0),
    [predictions]
  );
  const totalIncome = useMemo(
    () => incomes.reduce((sum, item) => sum + item.amount, 0),
    [incomes]
  );
  const netMonthly = totalIncome - totalExpenses;

  const expensePercent = totalIncome
    ? Math.min((totalExpenses / totalIncome) * 100, 100)
    : 0;

  const analyzerTotals = useMemo(() => {
    return transactions.reduce(
      (acc, item) => {
        if (item.amount >= 0) {
          acc.charges += item.amount;
        } else {
          acc.credits += Math.abs(item.amount);
        }
        acc.net += item.amount;
        return acc;
      },
      { charges: 0, credits: 0, net: 0 }
    );
  }, [transactions]);

  const topMerchants = useMemo(() => {
    const totals = transactions.reduce((acc, item) => {
      if (item.amount <= 0) {
        return acc;
      }
      acc[item.title] = (acc[item.title] || 0) + item.amount;
      return acc;
    }, {});
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [transactions]);

  const handlePredictionChange = (event) => {
    const { name, value } = event.target;
    setPredictionForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePredictionSubmit = (event) => {
    event.preventDefault();
    const cleanedArea = predictionForm.area.trim();
    const amount = Number(predictionForm.amount);

    if (!cleanedArea || Number.isNaN(amount) || amount <= 0) {
      return;
    }

    const next = {
      id: createId(),
      area: cleanedArea,
      amount,
      notes: predictionForm.notes.trim(),
      createdAt: new Date().toISOString(),
    };

    setPredictions((prev) => [next, ...prev]);
    setPredictionForm(defaultPredictionForm);
  };

  const handlePredictionDelete = (id) => {
    setPredictions((prev) => prev.filter((item) => item.id !== id));
  };

  const handlePredictionClear = () => {
    setPredictions([]);
  };

  const handleIncomeChange = (event) => {
    const { name, value } = event.target;
    setIncomeForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleIncomeSubmit = (event) => {
    event.preventDefault();
    const cleanedSource = incomeForm.source.trim();
    const amount = Number(incomeForm.amount);

    if (!cleanedSource || Number.isNaN(amount) || amount <= 0) {
      return;
    }

    const next = {
      id: createId(),
      source: cleanedSource,
      amount,
      notes: incomeForm.notes.trim(),
      createdAt: new Date().toISOString(),
    };

    setIncomes((prev) => [next, ...prev]);
    setIncomeForm(defaultIncomeForm);
  };

  const handleIncomeDelete = (id) => {
    setIncomes((prev) => prev.filter((item) => item.id !== id));
  };

  const handleIncomeClear = () => {
    setIncomes([]);
  };

  const handleCsvUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const text = await file.text();
    const rows = parseCsv(text);
    const [header, ...dataRows] = rows;
    if (!header) {
      setAnalyzerError("The file appears to be empty.");
      return;
    }

    const normalizedHeader = header.map((col) =>
      col.trim().toLowerCase()
    );
    const dateIndex = normalizedHeader.indexOf("date");
    const titleIndex = normalizedHeader.indexOf("title");
    const amountIndex = normalizedHeader.indexOf("amount");

    if (dateIndex === -1 || titleIndex === -1 || amountIndex === -1) {
      setAnalyzerError(
        "Missing columns. Expected headers: date,title,amount."
      );
      return;
    }

    const parsed = dataRows
      .filter((row) => row.length > 1)
      .map((row, index) => {
        const amount = parseAmount(row[amountIndex] || "0");
        return {
          id: `${file.name}-${index}`,
          date: row[dateIndex]?.trim() || "",
          title: row[titleIndex]?.trim() || "Unknown",
          amount: Number.isNaN(amount) ? 0 : amount,
        };
      });

    setTransactions(parsed);
    setAnalyzerMeta({
      fileName: file.name,
      updatedAt: new Date().toLocaleString(),
    });
    setAnalyzerError("");
  };

  const handleLogin = () => {
    window.location.href = `${API_BASE}/auth/google`;
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "GET",
        credentials: "include",
      });
    } finally {
      setUser(null);
      setAuthStatus("unauthenticated");
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadUser = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/me`, {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Not authenticated");
        }
        const data = await response.json();
        if (isMounted) {
          setUser(data);
          setAuthStatus("authenticated");
        }
      } catch {
        if (isMounted) {
          setAuthStatus("unauthenticated");
        }
      }
    };
    loadUser();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(
      STORAGE_KEYS.predictions,
      JSON.stringify(predictions)
    );
  }, [predictions]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(
      STORAGE_KEYS.incomes,
      JSON.stringify(incomes)
    );
  }, [incomes]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(STORAGE_KEYS.currency, currency);
  }, [currency]);

  if (authStatus === "loading") {
    return (
      <div className="login-screen">
        <div className="login-card">
          <p className="tag">Finances App</p>
          <h1>Loading your workspace...</h1>
          <p className="muted">
            Checking your session and preparing your dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (authStatus !== "authenticated") {
    return (
      <div className="login-screen">
        <div className="login-card">
          <p className="tag">Finances App</p>
          <h1>Sign in to manage your monthly plan.</h1>
          <p className="subtitle">
            Use your Google account to securely access your budgets and
            predictions.
          </p>
          <button className="primary" type="button" onClick={handleLogin}>
            Continue with Google
          </button>
          <p className="muted">
            We only request basic profile and email access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-top">
          <div>
            <p className="tag">Monthly prediction planner</p>
            <h1>Forecast your monthly costs by area.</h1>
          </div>
          <div className="user-chip">
            {user?.photo ? (
              <img src={user.photo} alt="" />
            ) : (
              <div className="avatar-fallback">
                {user?.name?.slice(0, 1) || "U"}
              </div>
            )}
            <div>
              <p>{user?.name}</p>
              <span>{user?.email}</span>
            </div>
            <button
              type="button"
              className="ghost"
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        </div>
        <p className="subtitle">
          Capture your expected spending, track category totals, and keep your
          monthly budget visible.
        </p>
      </header>

      <div className="tabs">
        <button
          type="button"
          className={activeTab === "planning" ? "tab active" : "tab"}
          onClick={() => setActiveTab("planning")}
        >
          Financial Planning
        </button>
        <button
          type="button"
          className={activeTab === "analyzer" ? "tab active" : "tab"}
          onClick={() => setActiveTab("analyzer")}
        >
          Monthly Analyzer
        </button>
      </div>

      {activeTab === "planning" ? (
        <>
          <section className="grid">
            <div className="card form-card">
              <h2>Add a prediction</h2>
              <form
                onSubmit={handlePredictionSubmit}
                className="prediction-form"
              >
                <label>
                  Area
                  <input
                    list="area-options"
                    name="area"
                    value={predictionForm.area}
                    onChange={handlePredictionChange}
                    placeholder="e.g. Housing"
                    required
                  />
                  <datalist id="area-options">
                    {areaOptions.map((area) => (
                      <option value={area} key={area} />
                    ))}
                  </datalist>
                </label>
                <label>
                  Monthly amount
                  <input
                    name="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={predictionForm.amount}
                    onChange={handlePredictionChange}
                    placeholder="0.00"
                    required
                  />
                </label>
                <label>
                  Notes
                  <textarea
                    name="notes"
                    value={predictionForm.notes}
                    onChange={handlePredictionChange}
                    placeholder="Optional context for this cost"
                    rows="3"
                  />
                </label>
                <button type="submit" className="primary">
                  Add prediction
                </button>
              </form>
            </div>

            <div className="card form-card">
              <h2>Add income</h2>
              <form
                onSubmit={handleIncomeSubmit}
                className="prediction-form"
              >
                <label>
                  Source
                  <input
                    name="source"
                    value={incomeForm.source}
                    onChange={handleIncomeChange}
                    placeholder="e.g. Salary"
                    required
                  />
                </label>
                <label>
                  Monthly amount
                  <input
                    name="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={incomeForm.amount}
                    onChange={handleIncomeChange}
                    placeholder="0.00"
                    required
                  />
                </label>
                <label>
                  Notes
                  <textarea
                    name="notes"
                    value={incomeForm.notes}
                    onChange={handleIncomeChange}
                    placeholder="Optional context for this income"
                    rows="3"
                  />
                </label>
                <button type="submit" className="primary">
                  Add income
                </button>
              </form>
            </div>

            <div className="card summary-card">
              <h2>Monthly totals</h2>
              <div className="total">
                <span>Total expected spend</span>
                <strong>{formatCurrency(totalExpenses, currency)}</strong>
              </div>
              <div className="total">
                <span>Total monthly income</span>
                <strong>{formatCurrency(totalIncome, currency)}</strong>
              </div>
              <div className="total">
                <span>Net balance</span>
                <strong
                  className={netMonthly >= 0 ? "positive" : "negative"}
                >
                  {formatCurrency(netMonthly, currency)}
                </strong>
              </div>
              <div className="summary-list">
                {Object.keys(totalsByArea).length === 0 ? (
                  <p className="muted">
                    Add costs to see category totals.
                  </p>
                ) : (
                  Object.entries(totalsByArea).map(([area, amount]) => (
                    <div className="summary-row" key={area}>
                      <span>{area}</span>
                      <span>{formatCurrency(amount, currency)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="card viz-card">
            <div className="list-header">
              <h2>Monthly overview</h2>
              <div className="overview-meta">
                <p className="muted">Income vs. predicted expenses</p>
                <label className="currency-select">
                  Currency
                  <select
                    value={currency}
                    onChange={(event) => setCurrency(event.target.value)}
                  >
                    {currencyOptions.map((option) => (
                      <option key={option.code} value={option.code}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
            <div className="bar">
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${expensePercent}%` }}
                />
              </div>
              <div className="bar-labels">
                <span>
                  Expenses {formatCurrency(totalExpenses, currency)}
                </span>
                <span>
                  Income {formatCurrency(totalIncome, currency)}
                </span>
              </div>
            </div>
            <div className="mini-bars">
              {Object.keys(totalsByArea).length === 0 ? (
                <p className="muted">
                  Add costs to visualize areas.
                </p>
              ) : (
                Object.entries(totalsByArea).map(([area, amount]) => {
                  const percent = totalExpenses
                    ? Math.min((amount / totalExpenses) * 100, 100)
                    : 0;
                  return (
                    <div className="mini-row" key={area}>
                      <div className="mini-label">
                        <span>{area}</span>
                        <span>{formatCurrency(amount, currency)}</span>
                      </div>
                      <div className="mini-track">
                        <div
                          className="mini-fill"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="card list-card">
            <div className="list-header">
              <h2>Predictions</h2>
              <button
                type="button"
                className="ghost"
                onClick={handlePredictionClear}
                disabled={predictions.length === 0}
              >
                Clear all
              </button>
            </div>

            {predictions.length === 0 ? (
              <p className="muted">
                No predictions yet. Add your first one.
              </p>
            ) : (
              <ul className="prediction-list">
                {predictions.map((item) => (
                  <li key={item.id} className="prediction-item">
                    <div>
                      <p className="area">{item.area}</p>
                      <p className="notes">
                        {item.notes || "No notes added"}
                      </p>
                    </div>
                    <div className="item-actions">
                      <span className="amount">
                        {formatCurrency(item.amount, currency)}
                      </span>
                      <button
                        type="button"
                        className="ghost"
                        onClick={() => handlePredictionDelete(item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card list-card">
            <div className="list-header">
              <h2>Income</h2>
              <button
                type="button"
                className="ghost"
                onClick={handleIncomeClear}
                disabled={incomes.length === 0}
              >
                Clear all
              </button>
            </div>

            {incomes.length === 0 ? (
              <p className="muted">No income entries yet.</p>
            ) : (
              <ul className="prediction-list">
                {incomes.map((item) => (
                  <li key={item.id} className="prediction-item">
                    <div>
                      <p className="area">{item.source}</p>
                      <p className="notes">
                        {item.notes || "No notes added"}
                      </p>
                    </div>
                    <div className="item-actions">
                      <span className="amount">
                        {formatCurrency(item.amount, currency)}
                      </span>
                      <button
                        type="button"
                        className="ghost"
                        onClick={() => handleIncomeDelete(item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : (
        <>
          <section className="card analyzer-card">
            <div className="list-header">
              <h2>Upload credit card CSV</h2>
              <p className="muted">
                Expected headers: date,title,amount
              </p>
            </div>
            <label className="file-input">
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
              />
              <span>Choose CSV file</span>
            </label>
            {analyzerMeta.fileName ? (
              <p className="muted">
                Loaded {analyzerMeta.fileName} ·{" "}
                {analyzerMeta.updatedAt}
              </p>
            ) : null}
            {analyzerError ? (
              <p className="error-text">{analyzerError}</p>
            ) : null}
          </section>

          <section className="grid analyzer-grid">
            <div className="card summary-card">
              <h2>Monthly summary</h2>
              <div className="total">
                <span>Total charges</span>
                <strong>
                  {formatCurrency(analyzerTotals.charges, currency)}
                </strong>
              </div>
              <div className="total">
                <span>Total credits</span>
                <strong>
                  {formatCurrency(analyzerTotals.credits, currency)}
                </strong>
              </div>
              <div className="total">
                <span>Net activity</span>
                <strong
                  className={
                    analyzerTotals.net >= 0 ? "negative" : "positive"
                  }
                >
                  {formatCurrency(analyzerTotals.net, currency)}
                </strong>
              </div>
            </div>

            <div className="card">
              <h2>Top merchants</h2>
              {topMerchants.length === 0 ? (
                <p className="muted">
                  Upload a statement to see the biggest expenses.
                </p>
              ) : (
                <div className="summary-list">
                  {topMerchants.map(([title, amount]) => (
                    <div className="summary-row" key={title}>
                      <span>{title}</span>
                      <span>{formatCurrency(amount, currency)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="card list-card">
            <div className="list-header">
              <h2>Statement entries</h2>
              <p className="muted">{transactions.length} items</p>
            </div>
            {transactions.length === 0 ? (
              <p className="muted">
                Upload a CSV to see the detailed list.
              </p>
            ) : (
              <div className="table">
                <div className="table-row table-header">
                  <span>Date</span>
                  <span>Description</span>
                  <span>Amount</span>
                </div>
                {transactions.map((item) => (
                  <div className="table-row" key={item.id}>
                    <span>{item.date}</span>
                    <span>{item.title}</span>
                    <span
                      className={
                        item.amount < 0 ? "positive" : "negative"
                      }
                    >
                      {formatCurrency(item.amount, currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

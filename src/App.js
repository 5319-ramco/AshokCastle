import { useEffect, useMemo, useState } from 'react';
import './App.css';

const STORAGE_KEY = 'ashokcastle-apartments-v1';
const THEME_STORAGE_KEY = 'ashokcastle-theme';
const APARTMENT_NUMBERS = ['G1', 'F1', 'F2', 'F3', 'S1', 'S2'];
const EXPENSE_FIELDS = [
  { key: 'electricity', label: 'Common electricity bill' },
  { key: 'motor', label: 'Motor bill' },
  { key: 'security', label: 'Security' },
  { key: 'housekeeping', label: 'House keeping' },
];

function emptyApartment(apartmentNo) {
  return {
    id: apartmentNo,
    apartmentNo,
    address: '',
    photo: '',
    residentType: 'Owner',
    ownerContact: '',
    tenantContact: '',
    expenses: { electricity: '', motor: '', security: '', housekeeping: '' },
    expenseDates: { electricity: '', motor: '', security: '', housekeeping: '' },
  };
}

function readApartments() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return APARTMENT_NUMBERS.map(emptyApartment);
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) throw new Error('Saved apartment data is invalid.');
    const byId = new Map(parsed.map((apartment) => [apartment.id, apartment]));
    return APARTMENT_NUMBERS.map((number) => {
      const existing = byId.get(number) || {};
      return {
        ...emptyApartment(number),
        ...existing,
        id: number,
        apartmentNo: existing.apartmentNo || number,
        expenses: { ...emptyApartment(number).expenses, ...existing.expenses },
        expenseDates: { ...emptyApartment(number).expenseDates, ...existing.expenseDates },
      };
    });
  } catch (error) {
    console.error('Could not read saved Ashok Castle apartments.', error);
    return APARTMENT_NUMBERS.map(emptyApartment);
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

function formatExpenseDate(value) {
  if (!value) return 'Date not set';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

function readTheme() {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch (error) {
    console.error('Could not read the saved Ashok Castle theme.', error);
    return 'light';
  }
}

function resizePhoto(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Choose an image file to upload.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('The selected photo could not be read.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('The selected photo could not be opened.'));
      image.onload = () => {
        const maxDimension = 1200;
        const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Your browser could not prepare this photo.'));
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function Icon({ name, size = 18 }) {
  const drawings = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    building: <><path d="M3 21h18M5 21V5l7-3 7 3v16M9 8h1m4 0h1m-6 4h1m4 0h1m-6 4h1m4 0h1m-5 5v-3h2v3" /></>,
    bill: <><path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Z" /><path d="M8 8h8m-8 4h8m-8 4h5" /></>,
    logout: <><path d="m10 17 5-5-5-5m5 5H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
    arrow: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
    edit: <><path d="m15 5 4 4M4 20l4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16l-1 4Z" /></>,
    upload: <><path d="M12 16V4m-5 5 5-5 5 5M4 20h16" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
    moon: <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{drawings[name]}</svg>;
}

function ThemeToggle({ theme, onToggle }) {
  const nextTheme = theme === 'light' ? 'dark' : 'light';
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
    >
      <Icon name={nextTheme === 'dark' ? 'moon' : 'sun'} size={16} />
      <span>{nextTheme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
    </button>
  );
}

function CastleLogo({ compact = false }) {
  return (
    <img
      className={`castle-logo${compact ? ' castle-logo-compact' : ''}`}
      src={`${process.env.PUBLIC_URL}/castle_logo_blue_white_small.png`}
      alt=""
    />
  );
}

function Login({ onLogin, theme, onToggleTheme }) {
  const [role, setRole] = useState('admin');
  const [username, setUsername] = useState('adminuser');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  function chooseRole(nextRole) {
    setRole(nextRole);
    setUsername(nextRole === 'admin' ? 'adminuser' : 'guest');
    setPassword(nextRole === 'admin' ? 'admin123' : 'guest123');
    setError('');
  }

  function handleSubmit(event) {
    event.preventDefault();
    const valid = role === 'admin'
      ? username === 'adminuser' && password === 'admin123'
      : username === 'guest' && password === 'guest123';
    if (!valid) {
      setError('The username or password is incorrect for this account.');
      return;
    }
    onLogin(role);
  }

  return (
    <main className="login-layout">
      <section className="login-visual">
        <a href="#home" className="brand brand-light" aria-label="Ashok Castle resident portal">
          <CastleLogo />
          <span>Ashok Castle</span>
        </a>
        <div className="login-story">
          <span className="eyebrow eyebrow-light">WELCOME TO YOUR COMMUNITY</span>
          <h1>A happier home<br />starts <em>together.</em></h1>
          <p>Apartment details, shared expenses, and the people who make Ashok Castle feel like home.</p>
        </div>
        <div className="login-architecture" aria-hidden="true">
          <div className="architecture-sun" />
          <div className="architecture-building building-one"><i /><i /><i /><i /><i /><i /></div>
          <div className="architecture-building building-two"><i /><i /><i /><i /><i /><i /></div>
          <div className="architecture-building building-three"><i /><i /><i /><i /></div>
          <span>HOME, WELL LOOKED AFTER.</span>
        </div>
        <div className="login-visual-footer"><span /> A close-knit community in the heart of the city</div>
      </section>

      <section className="login-content">
        <div className="login-topline"><span>Resident portal</span><div className="login-topline-actions"><span className="secure-label"><Icon name="shield" size={15} /> Your community space</span><ThemeToggle theme={theme} onToggle={onToggleTheme} /></div></div>
        <div className="login-card">
          <div className="mobile-brand"><CastleLogo compact /><span>Ashok Castle</span></div>
          <span className="eyebrow">YOUR HOME, AT A GLANCE</span>
          <h2>Sign in to<br />Ashok Castle.</h2>
          <p className="login-intro">A little more connected to the place you call home.</p>
          <div className="role-tabs" aria-label="Account type">
            <button type="button" className={role === 'admin' ? 'active' : ''} onClick={() => chooseRole('admin')}>Administrator</button>
            <button type="button" className={role === 'guest' ? 'active' : ''} onClick={() => chooseRole('guest')}>Guest user</button>
          </div>
          <form onSubmit={handleSubmit} className="login-form">
            <label htmlFor="username">Username</label>
            <input id="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required />
            <label htmlFor="password">Password</label>
            <input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            {error && <p className="inline-error" role="alert">{error}</p>}
            <button className="button-primary sign-in-button" type="submit">Open resident portal <Icon name="arrow" /></button>
          </form>
          <div className="credentials-note">
            <span>DEMO SIGN-IN</span>
            <p><strong>Admin:</strong> adminuser / admin123<br /><strong>Guest:</strong> guest / guest123</p>
          </div>
          <p className="demo-warning">Demo accounts are for local preview only; use a secure authentication service before public deployment.</p>
        </div>
        <div className="login-copyright">ASHOK CASTLE <span>·</span> RESIDENTS &amp; MANAGEMENT</div>
      </section>
    </main>
  );
}

function ApartmentEditor({ apartment, onSave, onClose }) {
  const [form, setForm] = useState(() => ({
    ...emptyApartment(apartment.apartmentNo),
    ...apartment,
    expenses: { ...emptyApartment(apartment.apartmentNo).expenses, ...apartment.expenses },
    expenseDates: { ...emptyApartment(apartment.apartmentNo).expenseDates, ...apartment.expenseDates },
  }));
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState('');

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function setExpense(key, value) {
    setForm((current) => ({ ...current, expenses: { ...current.expenses, [key]: value } }));
  }

  function setExpenseDate(key, value) {
    setForm((current) => ({ ...current, expenseDates: { ...current.expenseDates, [key]: value } }));
  }

  async function uploadPhoto(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    setError('');
    setPhotoBusy(true);
    try {
      const photo = await resizePhoto(file);
      setField('photo', photo);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setPhotoBusy(false);
      event.target.value = '';
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!form.apartmentNo.trim()) {
      setError('Apartment number is required.');
      return;
    }
    onSave({ ...form, apartmentNo: form.apartmentNo.trim() });
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="editor-modal" role="dialog" aria-modal="true" aria-labelledby="editor-heading">
        <div className="modal-header">
          <div><span className="eyebrow">APARTMENT DETAILS</span><h2 id="editor-heading">Edit {apartment.apartmentNo}</h2></div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close editor"><Icon name="close" /></button>
        </div>
        <p className="modal-intro">Keep apartment and resident details up to date.</p>
        <form className="editor-form" onSubmit={handleSubmit}>
          <div className="photo-field">
            <div className="photo-preview">
              {form.photo
                ? <img src={form.photo} alt={`${form.apartmentNo} apartment`} />
                : <span className="photo-placeholder"><CastleLogo compact /><span>Apartment photo</span></span>}
            </div>
            <div className="photo-controls">
              <strong>Apartment photo</strong>
              <span>Upload a JPG, PNG, or other image. It will appear on the apartment card.</span>
              <label className={`upload-button${photoBusy ? ' disabled' : ''}`}>
                <Icon name="upload" size={16} />{photoBusy ? 'Preparing photo…' : form.photo ? 'Change photo' : 'Upload photo'}
                <input type="file" accept="image/*" onChange={uploadPhoto} disabled={photoBusy} aria-label="Upload apartment photo" />
              </label>
              {form.photo && <button type="button" className="remove-photo" onClick={() => setField('photo', '')}>Remove photo</button>}
            </div>
          </div>
          <div className="form-grid">
            <div className="field"><label htmlFor="apartment-number">Apartment no.</label><input id="apartment-number" value={form.apartmentNo} onChange={(event) => setField('apartmentNo', event.target.value)} required /></div>
            <div className="field"><label htmlFor="resident-type">Tenant / Owner</label><select id="resident-type" value={form.residentType} onChange={(event) => setField('residentType', event.target.value)}><option>Owner</option><option>Tenant</option></select></div>
          </div>
          <div className="field"><label htmlFor="apartment-address">Address</label><textarea id="apartment-address" rows="2" placeholder="Enter the apartment address" value={form.address} onChange={(event) => setField('address', event.target.value)} /></div>
          <div className="form-grid">
            <div className="field"><label htmlFor="owner-phone">Owner contact number</label><input id="owner-phone" type="tel" autoComplete="tel" placeholder="Enter phone number" value={form.ownerContact} onChange={(event) => setField('ownerContact', event.target.value)} /></div>
            <div className="field"><label htmlFor="tenant-phone">Tenant contact number</label><input id="tenant-phone" type="tel" autoComplete="tel" placeholder="Enter phone number" value={form.tenantContact} onChange={(event) => setField('tenantContact', event.target.value)} /></div>
          </div>
          <div className="expense-fields-heading"><span>MONTHLY SHARED EXPENSES</span><small>Amount in INR</small></div>
          <div className="form-grid expense-grid">
            {EXPENSE_FIELDS.map((expense) => (
              <div className="field expense-entry" key={expense.key}>
                <label htmlFor={`expense-${expense.key}`}>{expense.label}</label>
                <div className="currency-field"><span>₹</span><input id={`expense-${expense.key}`} type="number" min="0" step="0.01" placeholder="0" value={form.expenses[expense.key]} onChange={(event) => setExpense(expense.key, event.target.value)} /></div>
                <label className="expense-date-label" htmlFor={`expense-date-${expense.key}`}>{expense.label} date paid / recorded</label>
                <input id={`expense-date-${expense.key}`} type="date" value={form.expenseDates[expense.key]} onChange={(event) => setExpenseDate(expense.key, event.target.value)} />
              </div>
            ))}
          </div>
          {error && <p className="inline-error" role="alert">{error}</p>}
          <div className="modal-actions"><button className="button-secondary" type="button" onClick={onClose}>Cancel</button><button className="button-primary" type="submit" disabled={photoBusy}>Save apartment</button></div>
        </form>
      </section>
    </div>
  );
}

function ApartmentCard({ apartment, index, canEdit, onEdit }) {
  const expenseTotal = EXPENSE_FIELDS.reduce((total, expense) => total + (Number(apartment.expenses[expense.key]) || 0), 0);
  return (
    <article className="apartment-card">
      <div className={`apartment-photo${apartment.photo ? ' has-photo' : ''}`}>
        {apartment.photo
          ? <img src={apartment.photo} alt={`${apartment.apartmentNo} apartment`} />
          : <div className="photo-empty"><CastleLogo /><span>Apartment photo</span></div>}
        <span className={`occupancy-badge${apartment.residentType === 'Tenant' ? ' tenant' : ''}`}><i />{apartment.residentType}</span>
        {canEdit && <button className="edit-card-button" type="button" onClick={() => onEdit(apartment)} aria-label={`Edit ${apartment.apartmentNo}`}><Icon name="edit" size={15} /><span>Edit</span></button>}
      </div>
      <div className="apartment-card-content">
        <span className="apartment-kicker">APARTMENT {String(index + 1).padStart(2, '0')}</span>
        <h3>{apartment.apartmentNo}</h3>
        <p className={`apartment-address${!apartment.address ? ' empty-address' : ''}`}>{apartment.address || 'Address not added yet'}</p>
        <div className="contact-details">
          <div><span>OWNER</span><strong>{apartment.ownerContact || 'Not provided'}</strong></div>
          <div><span>TENANT</span><strong>{apartment.tenantContact || 'Not provided'}</strong></div>
        </div>
        <div className="apartment-card-footer"><span>MONTHLY SHARED EXPENSES</span><strong>{formatCurrency(expenseTotal)}</strong></div>
      </div>
    </article>
  );
}

function ExpenseBreakdown({ apartments, canEdit, onEdit }) {
  const totals = EXPENSE_FIELDS.map((expense) => ({
    ...expense,
    amount: apartments.reduce((sum, apartment) => sum + (Number(apartment.expenses[expense.key]) || 0), 0),
  }));
  const communityTotal = totals.reduce((sum, expense) => sum + expense.amount, 0);
  const largestExpense = Math.max(0, ...totals.map((expense) => expense.amount));

  return (
    <>
      <section className="expense-total-card"><div><span>MONTHLY COMMUNITY TOTAL</span><strong>{formatCurrency(communityTotal)}</strong></div><span className="expense-total-mark"><Icon name="bill" size={22} /></span></section>
      <section className="panel expense-chart-panel" aria-labelledby="expense-chart-heading">
        <div className="section-heading"><div><span className="eyebrow">COMMUNITY SPENDING</span><h2 id="expense-chart-heading">Expenses by category</h2><p>Compare shared costs across the apartments.</p></div></div>
        <div className="expense-bar-chart" role="list" aria-label="Expense totals by category">
          {totals.map((expense, index) => {
            const barWidth = largestExpense ? (expense.amount / largestExpense) * 100 : 0;
            return (
              <div className="chart-row" key={expense.key} role="listitem">
                <span className="chart-label">{expense.label}</span>
                <div
                  className={`chart-track chart-color-${index}`}
                  role="progressbar"
                  aria-label={`${expense.label} total`}
                  aria-valuemin="0"
                  aria-valuemax={largestExpense || 1}
                  aria-valuenow={expense.amount}
                >
                  <span className="chart-bar" style={{ width: `${barWidth}%` }} />
                </div>
                <strong className="chart-value">{formatCurrency(expense.amount)}</strong>
              </div>
            );
          })}
        </div>
      </section>
      <section className="expense-category-grid">
        {totals.map((expense, index) => <article className="expense-category" key={expense.key}><span className={`category-icon category-${index}`}>{index === 0 ? '↯' : index === 1 ? '◉' : index === 2 ? '⌑' : '✳'}</span><span>{expense.label}</span><strong>{formatCurrency(expense.amount)}</strong></article>)}
      </section>
      <section className="panel expense-table-panel">
        <div className="section-heading"><div><span className="eyebrow">BY APARTMENT</span><h2>Monthly breakdown</h2></div></div>
        <div className="table-wrap"><table><thead><tr><th>APARTMENT</th>{EXPENSE_FIELDS.map((expense) => <th key={expense.key}>{expense.label.toUpperCase()}</th>)}<th>TOTAL</th>{canEdit && <th />}</tr></thead>
          <tbody>{apartments.map((apartment) => {
            const total = EXPENSE_FIELDS.reduce((sum, expense) => sum + (Number(apartment.expenses[expense.key]) || 0), 0);
            return <tr key={apartment.id}><td><strong>{apartment.apartmentNo}</strong></td>{EXPENSE_FIELDS.map((expense) => <td key={expense.key} className="expense-table-cell"><strong>{formatCurrency(apartment.expenses[expense.key])}</strong><small>{formatExpenseDate(apartment.expenseDates[expense.key])}</small></td>)}<td className="table-total">{formatCurrency(total)}</td>{canEdit && <td><button className="table-edit-button" type="button" onClick={() => onEdit(apartment)}>Edit</button></td>}</tr>;
          })}</tbody>
        </table></div>
      </section>
    </>
  );
}

function App() {
  const [apartments, setApartments] = useState(readApartments);
  const [theme, setTheme] = useState(readTheme);
  const [userRole, setUserRole] = useState(null);
  const [activePage, setActivePage] = useState('Overview');
  const [editingApartment, setEditingApartment] = useState(null);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const canEdit = userRole === 'admin';

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      console.error('Could not save the Ashok Castle theme.', error);
    }
  }, [theme]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(apartments));
    } catch (error) {
      console.error('Could not save Ashok Castle apartment data.', error);
      setNotice('Changes could not be saved in this browser. Try a smaller photo or free up browser storage.');
    }
  }, [apartments]);

  const expenseTotals = useMemo(() => EXPENSE_FIELDS.map((expense) => ({
    ...expense,
    amount: apartments.reduce((sum, apartment) => sum + (Number(apartment.expenses[expense.key]) || 0), 0),
  })), [apartments]);
  const totalExpenses = expenseTotals.reduce((sum, expense) => sum + expense.amount, 0);
  const owners = apartments.filter((apartment) => apartment.residentType === 'Owner').length;
  const visibleApartments = apartments.filter((apartment) => (
    `${apartment.apartmentNo} ${apartment.address} ${apartment.residentType}`.toLowerCase().includes(search.trim().toLowerCase())
  ));

  function saveApartment(updated) {
    setApartments((current) => current.map((apartment) => (
      apartment.id === editingApartment.id ? { ...updated, id: apartment.id } : apartment
    )));
    setEditingApartment(null);
    setNotice(`${updated.apartmentNo} details saved.`);
    window.setTimeout(() => setNotice(''), 3500);
  }

  function signOut() {
    setUserRole(null);
    setActivePage('Overview');
    setSearch('');
  }

  function toggleTheme() {
    setTheme((currentTheme) => currentTheme === 'light' ? 'dark' : 'light');
  }

  if (!userRole) return <Login onLogin={setUserRole} theme={theme} onToggleTheme={toggleTheme} />;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a href="#home" className="brand sidebar-brand" aria-label="Ashok Castle home"><CastleLogo /><span>Ashok Castle</span></a>
        <div className="community-chip"><span className="community-chip-icon"><CastleLogo compact /></span><span><strong>Ashok Castle</strong><small>Residential community</small></span><b>···</b></div>
        <span className="sidebar-label">COMMUNITY</span>
        <nav className="side-nav" aria-label="Main navigation">
          {['Overview', 'Apartments', 'Expenses'].map((page) => <button type="button" key={page} className={`nav-item${activePage === page ? ' active' : ''}`} onClick={() => { setActivePage(page); setSearch(''); }}><Icon name={page === 'Overview' ? 'grid' : page === 'Apartments' ? 'building' : 'bill'} /><span>{page}</span>{page === 'Apartments' && <small>{apartments.length}</small>}</button>)}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-note"><span>✳</span><strong>Home is a shared story.</strong><p>Thanks for making Ashok Castle a wonderful place to live.</p></div>
        <div className="user-row"><span className="user-avatar">{canEdit ? 'A' : 'G'}</span><span className="user-copy"><strong>{canEdit ? 'Administrator' : 'Guest user'}</strong><small>{canEdit ? 'Can edit apartment details' : 'Read-only access'}</small></span><button type="button" className="logout-button" aria-label="Sign out" onClick={signOut}><Icon name="logout" /></button></div>
      </aside>
      <main className="main-area">
        <header className="topbar"><div className="breadcrumbs"><span>Ashok Castle</span><b>/</b><strong>{activePage}</strong></div><div className="topbar-profile"><ThemeToggle theme={theme} onToggle={toggleTheme} /><span className={`role-badge${canEdit ? ' role-admin' : ''}`}><i />{canEdit ? 'Administrator' : 'Guest access'}</span><span className="topbar-avatar">{canEdit ? 'A' : 'G'}</span></div></header>
        <div className="page-content">
          {notice && <div className="notice" role="status">{notice}<button type="button" aria-label="Dismiss notification" onClick={() => setNotice('')}>×</button></div>}
          {activePage === 'Overview' && <>
            <section className="welcome-banner"><div className="welcome-copy"><span className="eyebrow eyebrow-light">A BETTER PLACE TO CALL HOME</span><h1>Welcome to Ashok Castle.</h1><p>Everything your community needs, all in one place.</p><button type="button" className="banner-link" onClick={() => setActivePage('Apartments')}>Explore the apartments <Icon name="arrow" size={16} /></button></div><div className="banner-logo"><CastleLogo /></div><span className="banner-count">06<small>HOMES</small></span></section>
            <section className="stats-grid" aria-label="Community overview">
              <article className="stat-card"><span className="stat-icon stat-green"><Icon name="building" /></span><span className="stat-label">APARTMENT HOMES</span><strong>{apartments.length.toString().padStart(2, '0')}</strong><small>In the Ashok Castle community</small></article>
              <article className="stat-card"><span className="stat-icon stat-gold"><Icon name="grid" /></span><span className="stat-label">OWNER OCCUPIED</span><strong>{owners.toString().padStart(2, '0')}</strong><small>{apartments.length - owners} tenant{apartments.length - owners === 1 ? '' : 's'} listed</small></article>
              <article className="stat-card"><span className="stat-icon stat-blue"><Icon name="bill" /></span><span className="stat-label">MONTHLY EXPENSES</span><strong>{formatCurrency(totalExpenses)}</strong><small>Shared costs across all homes</small></article>
            </section>
            <section className="panel overview-apartments"><div className="section-heading"><div><span className="eyebrow">GET TO KNOW THE PLACE</span><h2>Our apartments</h2><p>Six homes, one lovely community.</p></div><button type="button" className="view-all-button" onClick={() => setActivePage('Apartments')}>View all <Icon name="arrow" size={16} /></button></div><ApartmentGrid apartments={apartments} canEdit={canEdit} onEdit={setEditingApartment} /></section>
            <ExpenseTotals totals={expenseTotals} />
          </>}
          {activePage === 'Apartments' && <>
            <section className="page-title-row"><div><span className="eyebrow">GET TO KNOW THE PLACE</span><h1>Our apartments</h1><p>Explore each home, its residents, and shared expenses.</p></div><label className="search-control"><Icon name="search" size={16} /><input aria-label="Search apartments" placeholder="Search apartments" value={search} onChange={(event) => setSearch(event.target.value)} /></label></section>
            <ApartmentGrid apartments={visibleApartments} canEdit={canEdit} onEdit={setEditingApartment} empty={visibleApartments.length === 0} />
          </>}
          {activePage === 'Expenses' && <>
            <section className="page-title-row"><div><span className="eyebrow">LOOKING AFTER OUR HOME</span><h1>Shared expenses</h1><p>Monthly building expenses, clearly broken down.</p></div></section>
            <ExpenseBreakdown apartments={apartments} canEdit={canEdit} onEdit={setEditingApartment} />
          </>}
          <footer className="page-footer"><span><CastleLogo compact /> Ashok Castle</span><span>A little more connected to home.</span></footer>
        </div>
      </main>
      {editingApartment && canEdit && <ApartmentEditor apartment={editingApartment} onSave={saveApartment} onClose={() => setEditingApartment(null)} />}
    </div>
  );
}

function ApartmentGrid({ apartments, canEdit, onEdit, empty = false }) {
  if (empty) return <div className="empty-state">No apartments match your search.</div>;
  return <div className="apartment-grid">{apartments.map((apartment, index) => <ApartmentCard key={apartment.id} apartment={apartment} index={index} canEdit={canEdit} onEdit={onEdit} />)}</div>;
}

function ExpenseTotals({ totals }) {
  return <section className="expense-totals-strip"><div className="expense-strip-heading"><span className="eyebrow">THE EVERYDAY ESSENTIALS</span><h2>Shared running costs</h2></div><div className="expense-strip-items">{totals.map((expense, index) => <div className="expense-strip-item" key={expense.key}><span className={`expense-mini-icon mini-${index}`}>{index === 0 ? '↯' : index === 1 ? '◉' : index === 2 ? '⌑' : '✳'}</span><span>{expense.label}</span><strong>{formatCurrency(expense.amount)}</strong></div>)}</div></section>;
}

export default App;

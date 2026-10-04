import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

function signIn() {
  fireEvent.click(screen.getByRole('button', { name: /open resident portal/i }));
}

test('shows Ashok Castle logo and the six apartments after admin sign-in', () => {
  const { container } = render(<App />);

  expect(container.querySelector('.brand-light img')).toHaveAttribute(
    'src',
    '/castle_logo_blue_white_small.png',
  );
  expect(screen.getByRole('heading', { name: /sign in to ashok castle/i })).toBeInTheDocument();

  signIn();

  expect(screen.getByRole('heading', { name: /welcome to ashok castle/i })).toBeInTheDocument();
  for (const apartment of ['G1', 'F1', 'F2', 'F3', 'S1', 'S2']) {
    expect(screen.getByRole('heading', { name: apartment })).toBeInTheDocument();
  }
});

test('allows an administrator to edit and save apartment and expense details', () => {
  render(<App />);
  signIn();

  fireEvent.click(screen.getByRole('button', { name: /edit g1/i }));
  fireEvent.change(screen.getByLabelText(/apartment no\./i), { target: { value: 'G1A' } });
  fireEvent.change(screen.getByLabelText(/address/i), { target: { value: '12 Castle Road' } });
  fireEvent.change(screen.getByLabelText(/tenant \/ owner/i), { target: { value: 'Tenant' } });
  fireEvent.change(screen.getByLabelText(/owner contact number/i), { target: { value: '9876543210' } });
  fireEvent.change(screen.getByLabelText(/tenant contact number/i), { target: { value: '9876501234' } });
  fireEvent.change(screen.getByLabelText(/^common electricity bill$/i), { target: { value: '1200' } });
  fireEvent.change(screen.getByLabelText(/^motor bill$/i), { target: { value: '250' } });
  fireEvent.change(screen.getByLabelText(/^security$/i), { target: { value: '800' } });
  fireEvent.change(screen.getByLabelText(/^house keeping$/i), { target: { value: '500' } });
  fireEvent.change(screen.getByLabelText(/common electricity bill date paid/i), { target: { value: '2026-04-12' } });
  fireEvent.change(screen.getByLabelText(/motor bill date paid/i), { target: { value: '2026-04-13' } });
  fireEvent.change(screen.getByLabelText(/security date paid/i), { target: { value: '2026-04-14' } });
  fireEvent.change(screen.getByLabelText(/house keeping date paid/i), { target: { value: '2026-04-15' } });
  fireEvent.click(screen.getByRole('button', { name: /save apartment/i }));

  expect(screen.getByRole('heading', { name: 'G1A' })).toBeInTheDocument();
  expect(screen.getByText('12 Castle Road')).toBeInTheDocument();
  expect(screen.getByText('Tenant')).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent(/g1a details saved/i);
  expect(JSON.parse(window.localStorage.getItem('ashokcastle-apartments-v1'))[0]).toMatchObject({
    id: 'G1',
    apartmentNo: 'G1A',
    address: '12 Castle Road',
    residentType: 'Tenant',
    ownerContact: '9876543210',
    tenantContact: '9876501234',
    expenses: { electricity: '1200', motor: '250', security: '800', housekeeping: '500' },
    expenseDates: {
      electricity: '2026-04-12',
      motor: '2026-04-13',
      security: '2026-04-14',
      housekeeping: '2026-04-15',
    },
  });

  fireEvent.click(within(screen.getByRole('navigation')).getByRole('button', { name: /expenses/i }));
  expect(screen.getByRole('heading', { name: /expenses by category/i })).toBeInTheDocument();
  expect(screen.getByRole('progressbar', { name: /common electricity bill total/i })).toHaveAttribute('aria-valuenow', '1200');
  expect(screen.getByRole('progressbar', { name: /^security total$/i })).toHaveAttribute('aria-valuenow', '800');
  expect(screen.getByText(/12 Apr 2026/i)).toBeInTheDocument();
  expect(screen.getByText(/15 Apr 2026/i)).toBeInTheDocument();
});

test('renders an empty expense chart with zero-width bars when no amounts have been entered', () => {
  render(<App />);
  signIn();
  fireEvent.click(within(screen.getByRole('navigation')).getByRole('button', { name: /expenses/i }));

  const electricityBar = screen.getByRole('progressbar', { name: /common electricity bill total/i });
  expect(electricityBar).toHaveAttribute('aria-valuenow', '0');
  expect(electricityBar.querySelector('.chart-bar')).toHaveStyle({ width: '0%' });
});

test('guests can view apartments but cannot edit their details', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /guest user/i }));
  signIn();

  expect(screen.getByText('Guest access')).toBeInTheDocument();
  fireEvent.click(within(screen.getByRole('navigation')).getByRole('button', { name: /apartments/i }));
  expect(screen.getByRole('heading', { name: 'G1' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /edit g1/i })).not.toBeInTheDocument();
});

test('shows a helpful error when sign-in credentials are incorrect', () => {
  render(<App />);
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'incorrect' } });
  signIn();

  expect(screen.getByRole('alert')).toHaveTextContent(/username or password is incorrect/i);
  expect(screen.getByRole('heading', { name: /sign in to ashok castle/i })).toBeInTheDocument();
});

test('toggles the saved theme from the login page and dashboard', () => {
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /switch to dark mode/i }));
  expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  expect(window.localStorage.getItem('ashokcastle-theme')).toBe('dark');

  signIn();
  fireEvent.click(screen.getByRole('button', { name: /switch to light mode/i }));
  expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  expect(window.localStorage.getItem('ashokcastle-theme')).toBe('light');
});

test('restores the selected dark theme on a new visit', () => {
  window.localStorage.setItem('ashokcastle-theme', 'dark');
  render(<App />);

  expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument();
});

test('uploads, previews, and saves an apartment photo', async () => {
  jest.spyOn(window, 'Image').mockImplementation(() => {
    const image = { width: 1600, height: 1200, onload: null, onerror: null };
    Object.defineProperty(image, 'src', { set() { image.onload(); } });
    return image;
  });
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    drawImage: jest.fn(),
  });
  const photoData = 'data:image/jpeg;base64,Y2FzdGxl';
  jest.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(photoData);

  render(<App />);
  signIn();
  fireEvent.click(screen.getByRole('button', { name: /edit g1/i }));

  expect(screen.getByLabelText(/upload apartment photo/i)).toHaveAttribute('accept', 'image/*');
  expect(screen.getByRole('dialog').querySelector('.photo-placeholder')).toHaveTextContent('Apartment photo');
  fireEvent.change(screen.getByLabelText(/upload apartment photo/i), {
    target: { files: [new File(['castle'], 'castle.jpg', { type: 'image/jpeg' })] },
  });
  await waitFor(() => expect(screen.getByRole('dialog').querySelector('.photo-preview img')).toHaveAttribute('src', photoData));
  fireEvent.click(screen.getByRole('button', { name: /save apartment/i }));

  expect(screen.getByRole('img', { name: 'G1 apartment' })).toHaveAttribute('src', photoData);
  expect(JSON.parse(window.localStorage.getItem('ashokcastle-apartments-v1'))[0].photo).toBe(photoData);
});

test('persists apartment details after reloading the application', () => {
  const firstRender = render(<App />);
  signIn();
  fireEvent.click(screen.getByRole('button', { name: /edit g1/i }));
  fireEvent.change(screen.getByLabelText(/address/i), { target: { value: 'Castle Garden, Bengaluru' } });
  fireEvent.click(screen.getByRole('button', { name: /save apartment/i }));
  firstRender.unmount();

  render(<App />);
  signIn();
  expect(screen.getByText('Castle Garden, Bengaluru')).toBeInTheDocument();
});

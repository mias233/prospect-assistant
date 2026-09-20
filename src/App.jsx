import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Analyze from './pages/Analyze';
import Prospects from './pages/Prospects';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="analyze" element={<Analyze />} />
          <Route path="prospects" element={<Prospects />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

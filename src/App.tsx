import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import NewProduction from './pages/NewProduction';
import Workflow from './pages/Workflow';
import FinalPackage from './pages/FinalPackage';
import AssetsStudio from './pages/AssetsStudio';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/new" element={<NewProduction />} />
        <Route path="/project/:id" element={<Workflow />} />
        <Route path="/project/:id/assets" element={<AssetsStudio />} />
        <Route path="/project/:id/final" element={<FinalPackage />} />
        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}

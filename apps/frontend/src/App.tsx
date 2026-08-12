import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { MasterDataPage } from './pages/MasterDataPage';
import { DataTablePage } from './pages/DataTablePage';

function Protected(){const{user}=useAuth();return user?<Layout/>:<Navigate to="/login" replace/>}
export default function App(){return <Routes><Route path="/login" element={<Login/>}/><Route element={<Protected/>}><Route path="/" element={<Dashboard/>}/><Route path="/customers" element={<MasterDataPage kind="customers"/>}/><Route path="/suppliers" element={<MasterDataPage kind="suppliers"/>}/><Route path="/products" element={<MasterDataPage kind="products"/>}/><Route path="/inventory" element={<DataTablePage kind="inventory"/>}/><Route path="/purchases" element={<DataTablePage kind="purchases"/>}/><Route path="/sales" element={<DataTablePage kind="sales"/>}/><Route path="/finance" element={<DataTablePage kind="finance"/>}/></Route><Route path="*" element={<Navigate to="/" replace/>}/></Routes>}

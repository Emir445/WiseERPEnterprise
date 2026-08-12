import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { MasterDataPage } from './pages/MasterDataPage';
import { DataTablePage } from './pages/DataTablePage';
import { CommercialAdvanced } from './pages/CommercialAdvanced';
import { TreasuryPage } from './pages/TreasuryPage';
import { ProcurementPage } from './pages/ProcurementPage';
import { LogisticsPage } from './pages/LogisticsPage';
import { ProductionPage } from './pages/ProductionPage';
import { CrmPage } from './pages/CrmPage';
import { ServicesPage } from './pages/ServicesPage';
import { FiscalPage } from './pages/FiscalPage';
import { AuditPage } from './pages/AuditPage';
import { AdministrationPage } from './pages/AdministrationPage';

function Protected(){const{user}=useAuth();return user?<Layout/>:<Navigate to="/login" replace/>}
export default function App(){return <Routes><Route path="/login" element={<Login/>}/><Route element={<Protected/>}>
<Route path="/" element={<Dashboard/>}/><Route path="/customers" element={<MasterDataPage kind="customers"/>}/><Route path="/suppliers" element={<MasterDataPage kind="suppliers"/>}/><Route path="/products" element={<MasterDataPage kind="products"/>}/><Route path="/inventory" element={<DataTablePage kind="inventory"/>}/><Route path="/purchases" element={<DataTablePage kind="purchases"/>}/><Route path="/sales" element={<DataTablePage kind="sales"/>}/><Route path="/finance" element={<DataTablePage kind="finance"/>}/>
<Route path="/commercial" element={<CommercialAdvanced/>}/><Route path="/treasury" element={<TreasuryPage/>}/><Route path="/procurement" element={<ProcurementPage/>}/><Route path="/logistics" element={<LogisticsPage/>}/><Route path="/production" element={<ProductionPage/>}/><Route path="/crm" element={<CrmPage/>}/><Route path="/services" element={<ServicesPage/>}/><Route path="/fiscal" element={<FiscalPage/>}/><Route path="/audit" element={<AuditPage/>}/><Route path="/administration" element={<AdministrationPage/>}/>
</Route><Route path="*" element={<Navigate to="/" replace/>}/></Routes>}

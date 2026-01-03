import React from 'react'
import Navbar from './components/Navbar'
import { Route, Routes, useLocation } from 'react-router-dom'
import Login from './pages/Login';
import Footer from './components/Footer';
import AllRooms from './pages/AllRooms';
import RoomDetails from './pages/RoomDetails';
import MyBookings from './pages/MyBookings';
import AboutUs from './pages/AboutUs';
import HotelReg from './components/HotelReg';
import OwnerLayout from './components/OwnerLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Unauthorized from './pages/Unauthorized';
import Dashboard from './pages/hotelOwner/Dashboard';
import AddRoom from './pages/hotelOwner/AddRoom';
import ListRoom from './pages/hotelOwner/ListRoom';
import RouteOne from './pages/RouteOne';
import RouteTwo from './pages/RouteTwo';
import RouteThree from './pages/RouteThree';
import RouteFour from './pages/RouteFour';
import RouteFive from './pages/RouteFive';
import { exclusiveOffers } from './assets/assets';
import Information from './pages/Information';
import { ToastProvider } from './components/ui/Toast';

// Owner module imports
import OwnerDashboard from './modules/owner/dashboard/Dashboard';
import Pending from './modules/owner/reservations/Pending';
import Approved from './modules/owner/reservations/Approved';
import LawazimCollection from './modules/owner/accounts/LawazimCollection';
import NiyazCollection from './modules/owner/accounts/NiyazCollection';
import CashSubmission from './modules/owner/accounts/CashSubmission';
import Salaries from './modules/owner/accounts/Salaries';
import ExpensesTransport from './modules/owner/accounts/ExpensesTransport';
import ExpensesMaintenance from './modules/owner/accounts/ExpensesMaintenance';
import ExpensesMawaid from './modules/owner/accounts/ExpensesMawaid';
import ExpensesOther from './modules/owner/accounts/ExpensesOther';
import ThalCounts from './modules/owner/mawaid/ThalCounts';
import MakeRecipes from './modules/owner/mawaid/MakeRecipes';
import MenuPlanning from './modules/owner/mawaid/MenuPlanning';
import KitchenOperations from './modules/owner/mawaid/KitchenOperations';
import DiningHall from './modules/owner/mawaid/DiningHall';
import SupplyChain from './modules/owner/mawaid/SupplyChain';
import Inventory from './modules/owner/mawaid/Inventory';
import Vendors from './modules/owner/mawaid/Vendors';
import MawaidReports from './modules/owner/mawaid/Reports';
import Roster from './modules/owner/transport/Roster';
import JourneysIstiqbal from './modules/owner/transport/JourneysIstiqbal';
import JourneysSalawaat from './modules/owner/transport/JourneysSalawaat';
import JourneysMadina from './modules/owner/transport/JourneysMadina';
import JourneysZiyarah from './modules/owner/transport/JourneysZiyarah';
import VehicleMaintenance from './modules/owner/transport/VehicleMaintenance';
import DriverManagement from './modules/owner/transport/DriverManagement';
import Housekeeping from './modules/owner/accommodation/Housekeeping';
import Maintenance from './modules/owner/accommodation/Maintenance';
import CheckinsCheckouts from './modules/owner/accommodation/CheckinsCheckouts';
import GridLayout from './modules/owner/accommodation/GridLayout';
import VacancyForecast from './modules/owner/accommodation/VacancyForecast';
import StaffDirectory from './modules/owner/hr/StaffDirectory';
import Scheduling from './modules/owner/hr/Scheduling';
import LeaveManagement from './modules/owner/hr/LeaveManagement';
import Training from './modules/owner/hr/Training';
import ReservationsReport from './modules/owner/reports/ReservationsReport';
import AccountsReport from './modules/owner/reports/AccountsReport';
import TransportReport from './modules/owner/reports/TransportReport';
import MawaidReport from './modules/owner/reports/MawaidReport';
import AccommodationReport from './modules/owner/reports/AccommodationReport';
import FakkulEhraam from './modules/owner/reports/FakkulEhraam';
import LegalReport from './modules/owner/reports/LegalReport';
import HRReport from './modules/owner/reports/HRReport';
import UsersRoles from './modules/owner/system/UsersRoles';
import Settings from './modules/owner/system/Settings';
const App = () => {

  const location = useLocation();
  const isOwnerPath = location.pathname.includes("owner");

  // Dynamic route components mapping
  const routeComponents = {
    1: RouteOne,
    2: RouteTwo,
    3: RouteThree,
    4: RouteFour,
    5: RouteFive
  };

  return (
    <ToastProvider>
      <div>
       {!isOwnerPath && <Navbar />}
       {false && <HotelReg />}
       <div className='min-h-[70vh]'>
        <Routes>
        <Route path='/' element={<Login/>} />
        <Route path='/information' element={<Information/>} />
        <Route path='/aboutUs' element={<AboutUs/>} />
        <Route path='/rooms' element={<AllRooms/>} />
        {/* Dynamic routes based on exclusiveOffers data */}
        {exclusiveOffers.map((offer, index) => {
          const routeNumber = index + 1;
          const RouteComponent = routeComponents[routeNumber];
          return RouteComponent ? (
            <Route
              key={offer._id}
              path={`/route${routeNumber}`}
              element={<RouteComponent />}
            />
          ) : null;
        })}
        <Route path='/rooms/:id' element={<RoomDetails/>} />
        <Route path='/my-bookings' element={<MyBookings/>} />
        <Route path='/unauthorized' element={<Unauthorized />} />

        <Route path='/owner' element={
          <ProtectedRoute requireAuth={true}>
            <OwnerLayout/>
          </ProtectedRoute>
        }>
            <Route index element={<Dashboard/>} />
            <Route path="add-room" element={<AddRoom/>} />
            <Route path="list-room" element={<ListRoom/>} />

            {/* Dashboard */}
            <Route path="dashboard" element={<OwnerDashboard/>} />

            {/* Reservations */}
            <Route path="reservations/pending" element={<Pending/>} />
            <Route path="reservations/approved" element={<Approved/>} />

            {/* Accounts */}
            <Route path="accounts/lawazim-collection" element={<LawazimCollection/>} />
            <Route path="accounts/niyaz-collection" element={<NiyazCollection/>} />
            <Route path="accounts/cash-submission" element={<CashSubmission/>} />
            <Route path="accounts/salaries" element={<Salaries/>} />
            <Route path="accounts/expenses/transport" element={<ExpensesTransport/>} />
            <Route path="accounts/expenses/maintenance" element={<ExpensesMaintenance/>} />
            <Route path="accounts/expenses/mawaid" element={<ExpensesMawaid/>} />
            <Route path="accounts/expenses/other" element={<ExpensesOther/>} />

            {/* Mawaid */}
            <Route path="mawaid/thal-counts" element={<ThalCounts/>} />
            <Route path="mawaid/make-recipes" element={<MakeRecipes/>} />
            <Route path="mawaid/menu-planning" element={<MenuPlanning/>} />
            <Route path="mawaid/kitchen-operations" element={<KitchenOperations/>} />
            <Route path="mawaid/dining-hall" element={<DiningHall/>} />
            <Route path="mawaid/supply-chain" element={<SupplyChain/>} />
            <Route path="mawaid/inventory" element={<Inventory/>} />
            <Route path="mawaid/vendors" element={<Vendors/>} />
            <Route path="mawaid/reports" element={<MawaidReports/>} />

            {/* Transport */}
            <Route path="transport/roster" element={<Roster/>} />
            <Route path="transport/journeys/istiqbal" element={<JourneysIstiqbal/>} />
            <Route path="transport/journeys/salawaat" element={<JourneysSalawaat/>} />
            <Route path="transport/journeys/madina" element={<JourneysMadina/>} />
            <Route path="transport/journeys/ziyarah" element={<JourneysZiyarah/>} />
            <Route path="transport/vehicle-maintenance" element={<VehicleMaintenance/>} />
            <Route path="transport/driver-management" element={<DriverManagement/>} />

            {/* Accommodation */}
            <Route path="accommodation/housekeeping" element={<Housekeeping/>} />
            <Route path="accommodation/maintenance" element={<Maintenance/>} />
            <Route path="accommodation/checkins-checkouts" element={<CheckinsCheckouts/>} />
            <Route path="accommodation/grid-layout" element={<GridLayout/>} />
            <Route path="accommodation/vacancy-forecast" element={<VacancyForecast/>} />

            {/* HR */}
            <Route path="hr/staff-directory" element={<StaffDirectory/>} />
            <Route path="hr/scheduling" element={<Scheduling/>} />
            <Route path="hr/leave-management" element={<LeaveManagement/>} />
            <Route path="hr/training" element={<Training/>} />

            {/* Reports */}
            <Route path="reports/reservations" element={<ReservationsReport/>} />
            <Route path="reports/accounts" element={<AccountsReport/>} />
            <Route path="reports/transport" element={<TransportReport/>} />
            <Route path="reports/mawaid" element={<MawaidReport/>} />
            <Route path="reports/accommodation" element={<AccommodationReport/>} />
            <Route path="reports/fakkul-ehraam" element={<FakkulEhraam/>} />
            <Route path="reports/legal" element={<LegalReport/>} />
            <Route path="reports/human-resources" element={<HRReport/>} />

            {/* System */}
            <Route path="system/users-roles" element={<UsersRoles/>} />
            <Route path="system/settings" element={<Settings/>} />
        </Route>
        </Routes>
       </div>
       <Footer />
      </div>
    </ToastProvider>
  )
}

export default App

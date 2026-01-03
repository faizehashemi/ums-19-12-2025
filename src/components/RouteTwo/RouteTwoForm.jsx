import React, { useMemo, useState } from "react";
import FlyonStepperShell from "./FlyonStepperShell";
import StepTravelDetails from "./steps/StepTravelDetails";
import StepMembers from "./steps/StepMembers";
import StepDocuments from "./steps/StepDocuments";
import StepAccommodation from "./steps/StepAccommodation";
import StepFees from "./steps/StepFees";
import StepReview from "./steps/StepReview";
import { supabase } from "../../lib/supabase";
import { useAuth } from '../../contexts/AuthContext';

export default function RouteTwoForm() {
  const { user } = useAuth();
  const steps = ["Travel", "Members", "Documents", "Accommodation", "Fees", "Review"];
  const totalPages = steps.length;

  const [currentPage, setCurrentPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [members, setMembers] = useState([]);
  const [memberCounter, setMemberCounter] = useState(0);

  // Page 1 state
  const [travelDetails, setTravelDetails] = useState({
    country: "",
    travelMode: "",
    roadMode: "",
    airline: "",
    flightNo: "",
    arrivalDateTime: "",
    travelMadinaDate: "",
    makkahMadinaDate: "",
    departureDateTime: "",
    departureAirport: "",
    departureAirline: "",
    departureFlightNo: "",
  });

  // Page 2 state
  const [memberData, setMemberData] = useState({});

  // Page 3 state
  const [documents, setDocuments] = useState({});

  // Page 4 state
  const [accommodation, setAccommodation] = useState("");
  const [westernToilet, setWesternToilet] = useState(false);
  const [makkahDays, setMakkahDays] = useState("");
  const [madinaDays, setMadinaDays] = useState("");

  const countries = useMemo(
    () => [
      "United States",
      "India",
      "Pakistan",
      "United Kingdom",
      "Canada",
      "Australia",
      "United Arab Emirates",
      "Saudi Arabia",
      "Egypt",
      "Turkey",
    ],
    []
  );

  const airlines = useMemo(
    () => [
      "Saudi Arabian Airlines",
      "Emirates",
      "Qatar Airways",
      "Etihad Airways",
      "Air India",
      "Turkish Airlines",
      "British Airways",
      "Lufthansa",
    ],
    []
  );

  const visaTypes = useMemo(() => ["Umrah", "Iqama", "Tourist", "Visit"], []);

  // ---- Members helpers ----
  const addMember = (customId) => {
    const newId = customId || memberCounter + 1;
    setMembers((prev) => [...prev, { id: newId }]);
    if (!customId) {
      setMemberCounter(newId);
    }
  };

  const removeMember = (id) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    setMemberData((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setDocuments((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const updateMemberData = (id, field, value) => {
    setMemberData((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  // ---- Validation ----
  const validatePage = () => {
    if (currentPage === 1) {
      if (!travelDetails.country || !travelDetails.travelMode) {
        alert("Please fill in all required fields");
        return false;
      }
      if (travelDetails.travelMode === "By Road" && !travelDetails.roadMode) {
        alert("Please select road travel mode");
        return false;
      }
      if (
        travelDetails.travelMode === "By Air" &&
        (!travelDetails.airline || !travelDetails.flightNo)
      ) {
        alert("Please fill in airline details");
        return false;
      }
    }

    if (currentPage === 2) {
      if (members.length === 0) {
        alert("Please add at least one member");
        return false;
      }
      // All member fields are now optional
    }

    if (currentPage === 4) {
      if (!accommodation) {
        alert("Please select accommodation type");
        return false;
      }
      if (!makkahDays || makkahDays <= 0) {
        alert("Please enter number of days in Makkah");
        return false;
      }
      if (!madinaDays || madinaDays <= 0) {
        alert("Please enter number of days in Madina");
        return false;
      }
    }

    return true;
  };

  const nextPage = () => {
    if (!validatePage()) return;
    setCurrentPage((p) => Math.min(totalPages, p + 1));
    window.scrollTo(0, 0);
  };

  const prevPage = () => {
    setCurrentPage((p) => Math.max(1, p - 1));
    window.scrollTo(0, 0);
  };

  const goToStep = (step) => {
    setCurrentPage(step);
    window.scrollTo(0, 0);
  };

  // ---- Fees + submit ----
  const calculateTransportFee = (numPassengers) => {
    // Route 2 pricing: Jeddah Airport → Makkah → Atraf Makkah → Madina → Atraf Madina → Madina Airport
    if (numPassengers >= 2 && numPassengers <= 4) return 300;
    if (numPassengers >= 5 && numPassengers <= 8) return 250;
    if (numPassengers >= 9 && numPassengers <= 24) return 200;
    if (numPassengers >= 25 && numPassengers <= 39) return 150;
    if (numPassengers >= 40 && numPassengers <= 49) return 100;
    return 0; // No transport for less than 2 or more than 49
  };

  const calculateFees = () => {
    // Pricing schema based on age category and location
    const pricing = {
      Makkah: {
        Sharing: { Adult: 130, Child: 65, Infant: 0 },
        Exclusive: { Adult: 170, Child: 85, Infant: 0 }
      },
      Madina: {
        Sharing: { Adult: 130, Child: 65, Infant: 0 }
      }
    };

    let makkahTotal = 0;
    let madinaTotal = 0;
    const memberBreakdown = [];

    // Calculate accommodation fees for each member
    members.forEach((member) => {
      const data = memberData[member.id];
      const ageCategory = data?.ageCategory || "Adult";

      // Makkah calculation - use the selected accommodation type
      const makkahRate = pricing.Makkah[accommodation]?.[ageCategory] || 0;
      const makkahFee = makkahRate * parseFloat(makkahDays || 0);

      // Madina calculation (only Sharing available)
      const madinaRate = pricing.Madina.Sharing[ageCategory] || 0;
      const madinaFee = madinaRate * parseFloat(madinaDays || 0);

      makkahTotal += makkahFee;
      madinaTotal += madinaFee;

      memberBreakdown.push({
        name: data?.name || `Member ${member.id}`,
        ageCategory,
        makkahRate,
        makkahDays: parseFloat(makkahDays || 0),
        makkahFee,
        madinaRate,
        madinaDays: parseFloat(madinaDays || 0),
        madinaFee,
        totalFee: makkahFee + madinaFee
      });
    });

    // Total accommodation fees
    const totalAccommodationFees = makkahTotal + madinaTotal;

    // Municipal Tax (2.5% on accommodation fees)
    const municipalTax = totalAccommodationFees * 0.025;

    // Transport calculation
    const transportFeePerPerson = calculateTransportFee(members.length);
    const totalTransportFee = transportFeePerPerson * members.length;

    // Subtotal before VAT (accommodation + municipal tax + transport)
    const subtotalBeforeVAT = totalAccommodationFees + municipalTax + totalTransportFee;

    // VAT (15% on accommodation fees, municipal tax, and transport)
    const vat = subtotalBeforeVAT * 0.15;

    // Total including VAT
    const total = subtotalBeforeVAT + vat;

    return {
      makkahTotal,
      madinaTotal,
      totalAccommodationFees,
      municipalTax,
      transportFeePerPerson,
      totalTransportFee,
      subtotalBeforeVAT,
      vat,
      total,
      numMembers: members.length,
      memberBreakdown,
      makkahDays: parseFloat(makkahDays || 0),
      madinaDays: parseFloat(madinaDays || 0),
      makkahRoomType: accommodation
    };
  };

  const submitForm = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);

      const fees = calculateFees();
      const payload = {
        travelDetails,
        members: members.map((m) => ({
          ...memberData[m.id],
          documents: documents[m.id] || {},
        })),
        accommodation,
        fees,
      };

      console.log("Form Submission Payload:", payload);

      // Submit to Supabase
      const { data, error } = await supabase
        .from('reservations')
        .insert([
          {
            user_id: user?.id,
            // Travel details as JSONB
            travel_details: travelDetails,

            // Members as JSONB
            members: members.map((m) => ({
              ...memberData[m.id],
              documents: documents[m.id] || {},
            })),

            // Accommodation
            accommodation: accommodation,
            western_toilet: westernToilet,
            makkah_days: fees.makkahDays,
            madina_days: fees.madinaDays,
            makkah_room_type: accommodation,

            // Fees
            makkah_total: fees.makkahTotal,
            madina_total: fees.madinaTotal,
            total_accommodation_fees: fees.totalAccommodationFees,
            municipal_tax: fees.municipalTax,
            transport_fee_per_person: fees.transportFeePerPerson,
            total_transport_fee: fees.totalTransportFee,
            subtotal_before_vat: fees.subtotalBeforeVAT,
            vat: fees.vat,
            num_members: fees.numMembers,
            total_fee: fees.total,
            member_breakdown: fees.memberBreakdown,

            // Status
            status: 'pending'
          }
        ])
        .select();

      if (error) {
        console.error("Supabase error:", error);
        alert(`Error submitting form: ${error.message}`);
        return;
      }

      console.log("Supabase response:", data);
      alert("Form submitted successfully to Supabase!");
    } catch (err) {
      console.error("Submission error:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FlyonStepperShell
      steps={steps}
      currentStep={currentPage}
      onPrev={prevPage}
      onNext={nextPage}
      onFinish={currentPage === totalPages ? null : nextPage}
      onStepClick={goToStep}
      isFinal={currentPage === totalPages}
      submitting={submitting}
    >
      {currentPage === 1 && (
        <StepTravelDetails
          travelDetails={travelDetails}
          setTravelDetails={setTravelDetails}
          countries={countries}
          airlines={airlines}
        />
      )}

      {currentPage === 2 && (
        <StepMembers
          members={members}
          memberData={memberData}
          visaTypes={visaTypes}
          addMember={addMember}
          removeMember={removeMember}
          updateMemberData={updateMemberData}
        />
      )}

      {currentPage === 3 && (
        <StepDocuments
          members={members}
          memberData={memberData}
          documents={documents}
          setDocuments={setDocuments}
        />
      )}

      {currentPage === 4 && (
        <StepAccommodation
          accommodation={accommodation}
          setAccommodation={setAccommodation}
          westernToilet={westernToilet}
          setWesternToilet={setWesternToilet}
          makkahDays={makkahDays}
          setMakkahDays={setMakkahDays}
          madinaDays={madinaDays}
          setMadinaDays={setMadinaDays}
          travelDetails={travelDetails}
        />
      )}

      {currentPage === 5 && (
        <StepFees fees={calculateFees()} accommodation={accommodation} />
      )}

      {currentPage === 6 && (
        <StepReview
          travelDetails={travelDetails}
          members={members}
          memberData={memberData}
          documents={documents}
          accommodation={accommodation}
          fees={calculateFees()}
          onEdit={goToStep}
          onSubmit={submitForm}
          submitting={submitting}
        />
      )}
    </FlyonStepperShell>
  );
}

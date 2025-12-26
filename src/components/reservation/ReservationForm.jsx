import React, { useMemo, useState } from "react";
import FlyonStepperShell from "./FlyonStepperShell";
import StepTravelDetails from "./steps/StepTravelDetails";
import StepMembers from "./steps/StepMembers";
import StepDocuments from "./steps/StepDocuments";
import StepAccommodation from "./steps/StepAccommodation";
import StepFees from "./steps/StepFees";

export default function ReservationForm() {
  const steps = ["Travel", "Members", "Documents", "Accommodation", "Fees"];
  const totalPages = steps.length;

  const [currentPage, setCurrentPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [members, setMembers] = useState([{ id: 1 }]);
  const [memberCounter, setMemberCounter] = useState(1);

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
  const addMember = () => {
    const newId = memberCounter + 1;
    setMembers((prev) => [...prev, { id: newId }]);
    setMemberCounter(newId);
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
      for (let member of members) {
        const data = memberData[member.id];
        if (
          !data ||
          !data.name ||
          !data.itsNo ||
          !data.phone ||
          !data.email ||
          !data.visaType ||
          !data.passportName ||
          !data.passportNumber ||
          !data.age
        ) {
          alert("Please fill in all member details");
          return false;
        }
      }
    }

    if (currentPage === 4 && !accommodation) {
      alert("Please select accommodation type");
      return false;
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

  // ---- Fees + submit ----
  const calculateFees = () => {
    const baseFee = 500;
    const accommodationFee = accommodation === "Private" ? 300 : 150;
    const perPersonFee = baseFee + accommodationFee;
    const total = perPersonFee * members.length;

    return {
      baseFee,
      accommodationFee,
      perPersonFee,
      numMembers: members.length,
      total,
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
      alert("Form submitted successfully! Check the console for the payload.");
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
      onFinish={submitForm}
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
        />
      )}

      {currentPage === 5 && (
        <StepFees fees={calculateFees()} accommodation={accommodation} />
      )}
    </FlyonStepperShell>
  );
}

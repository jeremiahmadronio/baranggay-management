import React from "react";

interface InvitationPreviewProps {
  blotterNumber: string;
  respondentName: string;
  respondentAddress: string;
  natureOfComplaint: string;
  date: string;
}

export const InvitationPreview: React.FC<InvitationPreviewProps> = ({
  blotterNumber,
  respondentName,
  respondentAddress,
  natureOfComplaint,
  date,
}) => {
  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="bg-white rounded-xl p-10 lg:p-14 w-full h-full shadow-sm">
      <div className="flex flex-col items-center text-center">
        <div className="w-12 h-12 bg-blue-700 rounded-full flex items-center justify-center text-yellow-400 font-bold text-xl border-2 border-yellow-400 mb-3">
          BU
        </div>
        <p className="text-xs text-gray-700 font-medium">
          REPUBLIC OF THE PHILIPPINES
        </p>
        <p className="text-sm text-gray-900 font-bold tracking-wide">
          BARANGAY UGONG, VALENZUELA CITY
        </p>

        <h2 className="text-lg font-bold mt-6 tracking-widest text-gray-900">
          PAANYAYA
        </h2>
      </div>

      <div className="w-full border-t border-blue-600 mt-4 mb-8"></div>

      <div className="text-right mb-8 text-sm text-gray-700 font-medium">
        {formattedDate}
      </div>

      <div className="mb-8 text-sm text-gray-900 font-semibold">
        <p>{respondentName || "_________________"}</p>
        <p className="font-normal text-gray-700">{respondentAddress || "_________________"}</p>
      </div>

      <div className="mb-6 text-sm text-gray-900">
        <p>Mahal na Ginoo/Ginang:</p>
      </div>

      <div className="space-y-6 text-sm text-gray-800 leading-relaxed">
        <p>
          Kayo ay magalang na inaanyayahang humarap sa{" "}
          <span className="font-bold">Barangay Hall, Brgy. Ugong</span> upang
          tugunan ang reklamong nakatala bilang{" "}
          <span className="font-bold">{blotterNumber}</span> tungkol sa{" "}
          <span className="font-bold">{natureOfComplaint}</span>.
        </p>
        <p>
          Ang Barangay Ugong ay umaasa sa inyong pakikiisa upang mabigyan ng maayos
          at mapayapang resolusyon ang usaping ito.
        </p>
      </div>

      <div className="mt-16 text-right text-sm">
        <p className="font-bold text-gray-900">HON. MARICEL PINEDA</p>
        <p className="text-gray-500">Punong Barangay</p>
      </div>
    </div>
  );
};

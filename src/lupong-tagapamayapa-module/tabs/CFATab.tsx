// components/tabs/CFATab.tsx
import { useState } from 'react';
import { FileTextIcon, PrinterIcon, SaveIcon } from 'lucide-react';
import { jsPDF } from 'jspdf'; // Para sa PDF generation

export function CFATab({ luponData }: { luponData: any }) {
  const [grounds, setGrounds] = useState(
    "Ang nagrereklamo at ipinagrereklamo ay hindi nagkasundo sa ginanap na mediation..."
  );

  const handlePrint = () => {
    const doc = new jsPDF();
    doc.text("CERTIFICATE TO FILE ACTION", 10, 10);
    doc.text(`Blotter No: ${luponData.blotterNumber}`, 10, 20);
    doc.text(`Grounds: ${grounds}`, 10, 30);
    doc.save(`CFA_${luponData.blotterNumber}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Document Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileTextIcon className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-gray-900">CFA Document Preview</h3>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              <PrinterIcon className="w-4 h-4" /> Print PDF
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              <SaveIcon className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </div>

        {/* The "Dynamic" Part - Editable Textarea */}
        <div className="p-8 max-w-3xl mx-auto space-y-8 bg-gray-50 my-6 border border-dashed border-gray-300 rounded-lg">
           <div className="text-center space-y-1">
              <h2 className="text-xl font-bold">Pormularyo Blg. 1-B</h2>
              <p className="text-sm">Tanggapan ng Lupong Tagapamayapa</p>
           </div>
           
           <div className="space-y-4">
              <p className="text-sm font-bold">Usapin Blg: {luponData.blotterNumber}</p>
              <p className="text-sm">Tungkol sa: {luponData.incidentDetail.natureOfComplaint}</p>
           </div>

           <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Grounds for Certification (Editable)</label>
              <textarea 
                value={grounds}
                onChange={(e) => setGrounds(e.target.value)}
                className="w-full h-40 p-4 border border-gray-300 rounded-lg text-sm leading-relaxed focus:ring-2 focus:ring-blue-500"
                placeholder="I-type dito ang dahilan kung bakit nag-fail ang mediation..."
              />
           </div>
        </div>
      </div>
    </div>
  );
}
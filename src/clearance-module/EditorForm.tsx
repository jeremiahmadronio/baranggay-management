export const EditorForm = ({ data, setData }: any) => {
  const handleUpdate = (field: string, value: string) => {
    setData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleVariableUpdate = (key: string, value: string) => {
    setData((prev: any) => ({
      ...prev,
      variables: { ...prev.variables, [key]: value }
    }));
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
      
      <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 space-y-3">
        <div>
          <h3 className="font-bold text-blue-900 text-sm">Issue Certificate</h3>
          <p className="text-xs text-blue-700 mb-4">Fill out the resident's data. This will auto-fill the document.</p>
        </div>
        
        <div className="space-y-1">
           <label className="text-[11px] font-bold text-slate-700 uppercase">Full Name</label>
           <input 
             type="text" 
             value={data.variables?.FULL_NAME || ""}
             onChange={(e) => handleVariableUpdate("FULL_NAME", e.target.value)}
             className="border border-slate-300 px-3 py-2 w-full rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
             placeholder="Juan Dela Cruz"
           />
        </div>

        {data.dynamicFields?.map((field: any) => (
          <div key={field.key} className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 uppercase">{field.label}</label>
            <input 
              type="text" 
              value={data.variables?.[field.key] || ""}
              onChange={(e) => handleVariableUpdate(field.key, e.target.value)}
              className="border border-slate-300 px-3 py-2 w-full rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
              placeholder={field.placeholder}
            />
          </div>
        ))}
      </div>

      <hr className="border-slate-100" />

      <div className="space-y-4">
        <div>
          <h3 className="font-bold text-slate-800 text-sm">Edit Blueprint</h3>
          <p className="text-xs text-slate-500">Modify the default text of this template.</p>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-500 uppercase">Certificate Title</label>
          <input 
            type="text" 
            value={data.title}
            onChange={(e) => handleUpdate("title", e.target.value)}
            className="border border-slate-300 px-3 py-2 w-full rounded focus:border-blue-500 outline-none text-sm font-bold bg-slate-50"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-500 uppercase">Paragraph 1</label>
          <textarea 
            value={data.bodyText1}
            onChange={(e) => handleUpdate("bodyText1", e.target.value)}
            className="border border-slate-300 px-3 py-2 w-full rounded min-h-[120px] focus:border-blue-500 outline-none text-xs leading-relaxed bg-slate-50"
          />
        </div>

        {data.bodyText2 && (
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Paragraph 2</label>
            <textarea 
              value={data.bodyText2}
              onChange={(e) => handleUpdate("bodyText2", e.target.value)}
              className="border border-slate-300 px-3 py-2 w-full rounded min-h-[100px] focus:border-blue-500 outline-none text-xs leading-relaxed bg-slate-50"
            />
          </div>
        )}
      </div>
      
      <button className="w-full bg-slate-900 text-white py-3 font-bold rounded-lg shadow-md hover:bg-slate-800 active:scale-[0.98] transition-all">
        Save Template Changes
      </button>
    </div>
  );
};
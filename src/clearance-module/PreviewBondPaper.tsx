export const PreviewBondPaper = ({ data }: any) => {
  
  // Ito yung maghahanap ng {{TAGS}} sa paragraph at papalitan ng nilagay mo sa form
  const parseText = (text: string = "") => {
    let parsedText = text;
    const variables = data.variables || {};
    
    // Palitan yung mga may value na
    Object.keys(variables).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      // Kung blanko ang value, lagyan ng underscores para pwedeng sulatan
      const replacement = variables[key] 
        ? `<strong class="uppercase underline underline-offset-4 decoration-[1.5px]">${variables[key]}</strong>` 
        : "__________________";
      parsedText = parsedText.replace(regex, replacement);
    });

    // Hanapin yung mga naiwang {{TAGS}} na hindi pa nafi-fill-up sa form
    parsedText = parsedText.replace(/{{[a-zA-Z0-9_]+}}/g, "__________________");
    
    // Convert \n to <br/> para gumana ang enters
    parsedText = parsedText.replace(/\n/g, "<br/>");

    return <span dangerouslySetInnerHTML={{ __html: parsedText }} />;
  };

  return (
    <div className="relative mx-auto w-full max-w-[210mm] aspect-[1/1.414] bg-white shadow-xl border border-slate-200 p-[10%] flex flex-col font-serif">
      
      {/* PAPER HEADER */}
      <div className="text-center mb-10 shrink-0">
        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-[0.1em] text-slate-900 border-b-4 border-double border-slate-900 inline-block px-4 pb-1">
          {data.title}
        </h1>
      </div>

      {/* PAPER BODY CONTENT */}
      <div className="flex-1 text-[13px] md:text-[14px] leading-[1.8] text-slate-900 text-justify">
        
        {/* PARAGRAPH 1 */}
        <p className="mb-6 indent-8">{parseText(data.bodyText1)}</p>
        
        {/* KUNG TRICYCLE (May Listahan sa gitna) */}
        {data.hasGridLayout && (
           <div className="pl-12 mb-8 mt-4 grid grid-cols-1 gap-2">
              {data.dynamicFields.map((field: any) => {
                // Wag na isali ang PURPOSE sa listahan dahil nasa huling paragraph na siya
                if (field.key === 'PURPOSE') return null;
                
                return (
                  <div key={field.key} className="flex items-end gap-4 w-[70%]">
                    <span className="w-32 uppercase font-bold text-[11px] shrink-0 tracking-widest">{field.label}</span>
                    <span className="font-bold uppercase text-[12px] border-b border-dotted border-slate-800 flex-1 leading-none pb-0.5">
                      {data.variables?.[field.key] || "\u00A0"}
                    </span>
                  </div>
                )
              })}
           </div>
        )}

        {/* PARAGRAPH 2 */}
        {data.bodyText2 && (
          <p className="mb-6 indent-8">{parseText(data.bodyText2)}</p>
        )}
      </div>

      {/* PAPER FOOTER / SIGNATORIES */}
      <div className="mt-10 shrink-0 relative">
        <div className="absolute right-0 bottom-0 text-center">
           <p className="font-black uppercase text-[15px] tracking-tight border-b border-slate-900 pb-0.5 mb-1 px-4">
             MARICEL PINEDA - EMPERADOR
           </p>
           <p className="text-[12px] font-bold text-slate-700 tracking-wide">Punong Barangay</p>
        </div>
      </div>
      
    </div>
  );
};
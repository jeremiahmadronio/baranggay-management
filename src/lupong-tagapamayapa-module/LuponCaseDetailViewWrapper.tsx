import { useParams, useNavigate } from "react-router-dom";
import { LuponCaseDetailView } from "./LuponCaseView";

export default function LuponCaseDetailViewWrapper() {
  const { blotterNumber } = useParams();
  const navigate = useNavigate();

  if (!blotterNumber) return <div>Invalid case.</div>;

  return (
    <LuponCaseDetailView
      blotterNumber={blotterNumber}
      onBack={() => navigate(-1)}
    />
  );
}

import { useParams, useNavigate, useLocation } from "react-router-dom";
import { KapitanaLuponCaseDetailView } from "./LuponCaseView";

export default function KapitanaLuponCaseDetailViewWrapper() {
  const { blotterNumber } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const caseId = location.state?.caseId;

  if (!blotterNumber) return <div>Invalid case.</div>;

  return (
    <KapitanaLuponCaseDetailView
      blotterNumber={blotterNumber}
      onBack={() => navigate("/official-portal/lupon/cases")}
      caseId={caseId}
    />
  );
}

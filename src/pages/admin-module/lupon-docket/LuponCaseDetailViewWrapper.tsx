import { useParams, useNavigate, useLocation } from "react-router-dom";
import { LuponCaseDetailView } from "../../lupon-module/lupon-pages/LuponCaseView";

export default function AdminLuponCaseDetailViewWrapper() {
  const { blotterNumber } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const caseId = location.state?.caseId;

  if (!blotterNumber) return <div>Invalid case.</div>;

  return (
    <LuponCaseDetailView
      blotterNumber={blotterNumber}
      onBack={() => navigate(-1)}
      caseId={caseId}
      isAdminView={true}
    />
  );
}

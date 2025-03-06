import { Link, useLocation, useHistory } from 'react-router-dom';

interface Props<T> {
  title: string;
  subtitle?: string;
  prevDest?: string;
  prevState?: T;
}

export const PageHeader = <T,>(props: Props<T>): JSX.Element => {
  const { title, subtitle, prevDest, prevState } = props;
  const location = useLocation();
  const history = useHistory();

  const handleGoBack = () => {
    // Use browser history to go back if possible
    if (history.length > 1) {
      history.goBack();
    } else if (prevDest) {
      // Fallback to prevDest if no history
      history.push({
        pathname: prevDest,
        search: location.search,
        state: prevState
      });
    }
  };

  return (
    <div className='col-12'>
      <h4>{title}</h4>
      {subtitle && <p className="text-muted">{subtitle}</p>}
      {prevDest && (
        <h6>
          <span
            onClick={handleGoBack}
            className='text-decoration-none text-light cursor-pointer'
            style={{ cursor: 'pointer' }}
          >
            &lt;- Go back
          </span>
        </h6>
      )}
    </div>
  );
};

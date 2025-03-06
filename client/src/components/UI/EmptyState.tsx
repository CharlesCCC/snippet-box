import { Link } from 'react-router-dom';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export const EmptyState = ({ 
  title = "Nothing here yet", 
  description 
}: EmptyStateProps): JSX.Element => {
  const editorLink = (
    <Link to='/editor' className='fw-bold text-success text-decoration-none'>
      <span>editor</span>
    </Link>
  );

  return (
    <div className='col-12 d-flex flex-column align-items-center'>
      <h4>{title}</h4>
      {description ? (
        <p>{description}</p>
      ) : (
          <p>Go to the {editorLink} and create one</p>
          // <p></p>
      )}
    </div>
  );
};

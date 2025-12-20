import { NextPageContext } from 'next'

interface ErrorProps {
  statusCode: number
}

function Error({ statusCode }: ErrorProps) {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#0D0D0F',
      color: 'white'
    }}>
      <p>
        {statusCode
          ? `서버에서 ${statusCode} 오류가 발생했습니다`
          : '클라이언트에서 오류가 발생했습니다'}
      </p>
    </div>
  )
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default Error

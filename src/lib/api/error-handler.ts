export function handleApiError(error: any): string {
  if (error.response) {
    const status = error.response.status
    const message = error.response.data?.message
    
    switch (status) {
      case 400:
        return message || 'Dữ liệu không hợp lệ'
      case 401:
        return 'Vui lòng đăng nhập lại'
      case 403:
        return 'Bạn không có quyền truy cập'
      case 404:
        return message || 'Không tìm thấy dữ liệu'
      case 500:
        return 'Lỗi hệ thống, vui lòng thử lại sau'
      default:
        return 'Đã xảy ra lỗi, vui lòng thử lại'
    }
  }
  
  if (error.request) {
    return 'Không thể kết nối đến server'
  }
  
  return 'Đã xảy ra lỗi không xác định'
}

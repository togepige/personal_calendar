class notAwareDateTimeException(Exception):
	"""	
	当处理日期的过程中遇到没有时区信息的日起对象则引发此异常
	"""
	def __init__(self,dt):
		Exception.__init__(self)
		self.datetime = dt
	
class UserNotExistException(Exception):
	pass

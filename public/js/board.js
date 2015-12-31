(function($){
    $(function(){
        /* list */
        $('#search-form').on('submit', function(e){
            if($(this).find('[name=searchValue]').val() == 0){
                alert('검색어를 입력해 주시기 바랍니다.');
                $(this).find('[name=searchValue]').focus();
                return false;
            }
        });

        /* view */
        $('#deleteBtn').on('click', function(e){
            e.preventDefault();
            var isDelete = confirm('삭제하시겠습니까?');
            if(isDelete){
                location.href = $(this).attr('href');
            }
        });

        /* write,update,reply form */
        $('#write-form').on('submit', function(e){
            if($(this).find('[name=subject]').val().length == 0){
                alert('제목을 입력해 주세요.');
                $(this).find('[name=subject]').focus();
                return false;
            }

            if($(this).find('[name=writer]').val().length == 0){
                alert('작성자를 입력해 주세요.');
                $(this).find('[name=writer]').focus();
                return false;
            }

            if($(this).find('[name=password]').val().length < 4){
                alert('비밀번호를 4자이상 입력해 주세요.');
                $(this).find('[name=password]').focus();
                return false;
            }

            if($(this).find('[name=content]').val().length == 0){
                alert('내용을 입력해 주세요.');
                $(this).find('[name=content]').focus();
                return false;
            }
        });

        /* delete form */
        $('#delete-form').on('submit', function(e){
            if($(this).find('[name=password]').val().length < 4){
                alert('비밀번호를 4자이상 입력해 주세요.');
                $(this).find('[name=password]').focus();
                return false;
            }
        });

    });
}(jQuery));